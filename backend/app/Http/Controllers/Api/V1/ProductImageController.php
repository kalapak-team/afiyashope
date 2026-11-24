<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ReorderProductImagesRequest;
use App\Http\Requests\Api\UploadProductImagesRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class ProductImageController extends Controller
{
    public function store(UploadProductImagesRequest $request, Product $product): ProductResource
    {
        $files = $request->file('images');
        $diskName = config('filesystems.default');
        $disk = Storage::disk($diskName);
        $storedPaths = [];

        try {
            DB::transaction(function () use ($files, $product, $diskName, &$storedPaths) {
                $lockedProduct = Product::query()->whereKey($product->id)->lockForUpdate()->firstOrFail();
                if ($lockedProduct->images()->count() + count($files) > 5) {
                    throw ValidationException::withMessages([
                        'images' => ['អាចដាក់រូបភាពបានអតិបរមា ៥ រូបក្នុងម៉ូដមួយ។'],
                    ]);
                }
                $sortOrder = (int) $product->images()->max('sort_order') + 1;
                foreach ($files as $index => $file) {
                    $path = $file->store("products/{$product->id}", $diskName);
                    if (! $path) {
                        throw new RuntimeException('មិនអាចរក្សាទុកឯកសាររូបភាពបានទេ។');
                    }
                    $storedPaths[] = $path;
                    $product->images()->create([
                        'path' => $path,
                        'sort_order' => $sortOrder + $index,
                    ]);
                }
            });
        } catch (Throwable $error) {
            foreach ($storedPaths as $path) {
                if ($disk->exists($path) && ! $disk->delete($path)) {
                    Log::error('Failed to clean up a partially uploaded product image.', ['product_id' => $product->id]);
                }
            }
            throw $error;
        }

        return new ProductResource($product->load('images'));
    }

    public function destroy(Product $product, ProductImage $image): JsonResponse
    {
        abort_unless($image->product_id === $product->id, 404);
        $path = $image->path;
        $disk = Storage::disk(config('filesystems.default'));

        DB::transaction(function () use ($image, $product) {
            $image->delete();
            $product->images()->orderBy('sort_order')->orderBy('id')->get()
                ->each(fn ($remaining, $index) => $remaining->update(['sort_order' => $index]));
        });

        if (! preg_match('/^https?:\/\//i', $path) && $disk->exists($path) && ! $disk->delete($path)) {
            Log::error('Product image file deletion failed.', ['product_id' => $product->id, 'image_id' => $image->id]);
            throw new RuntimeException('មិនអាចលុបឯកសាររូបភាពបានទេ។');
        }

        return response()->json(['message' => 'បានលុបរូបភាពរួចរាល់។']);
    }

    public function reorder(ReorderProductImagesRequest $request, Product $product): ProductResource
    {
        $imageIds = $request->validated('image_ids');
        $currentIds = $product->images()->pluck('id')->map(fn ($id) => (int) $id)->all();
        $requestedIds = array_map('intval', $imageIds);
        sort($currentIds);
        $comparisonIds = $requestedIds;
        sort($comparisonIds);

        if ($currentIds !== $comparisonIds) {
            throw ValidationException::withMessages([
                'image_ids' => ['បញ្ជីរូបភាពត្រូវតែមានរូបភាពទាំងអស់របស់ម៉ូដនេះ។'],
            ]);
        }

        DB::transaction(function () use ($product, $requestedIds) {
            foreach ($requestedIds as $index => $imageId) {
                $product->images()->whereKey($imageId)->update(['sort_order' => $index]);
            }
        });

        return new ProductResource($product->load('images'));
    }
}
