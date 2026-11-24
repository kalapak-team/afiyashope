<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ListProductsRequest;
use App\Http\Requests\Api\StoreProductRequest;
use App\Http\Requests\Api\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ShopSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class ProductController extends Controller
{
    public function index(ListProductsRequest $request)
    {
        $filters = $request->validated();
        $query = Product::query()->with('images');

        if (! empty($filters['search'])) {
            $term = '%'.str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $filters['search']).'%';
            $query->where(function ($builder) use ($term) {
                $builder->where('name', 'ILIKE', $term)
                    ->orWhere('description', 'ILIKE', $term)
                    ->orWhereRaw('CAST(price AS TEXT) ILIKE ?', [$term])
                    ->orWhereRaw('CAST(old_price AS TEXT) ILIKE ?', [$term]);
            });
        }

        if (! empty($filters['tag'])) {
            $query->where('tag', $filters['tag']);
        }

        if (! empty($filters['stock'])) {
            $query->where('stock', $filters['stock']);
        }

        return ProductResource::collection(
            $query->orderByDesc('created_at')->orderByDesc('id')
                ->paginate($filters['per_page'] ?? 16)
        );
    }

    public function show(Product $product): ProductResource
    {
        return new ProductResource($product->load('images'));
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = DB::transaction(function () use ($request) {
            ShopSetting::query()->orderBy('id')->lockForUpdate()->firstOrFail();
            if (Product::query()->count() >= 200) {
                throw ValidationException::withMessages([
                    'name' => ['កាតាឡុកបានដល់ចំនួនអតិបរមា ២០០ ម៉ូដហើយ។'],
                ]);
            }

            return Product::create($request->validated());
        });

        return (new ProductResource($product->load('images')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateProductRequest $request, Product $product): ProductResource
    {
        $product->update($request->validated());

        return new ProductResource($product->load('images'));
    }

    public function destroy(Product $product): JsonResponse
    {
        $paths = $product->images()->pluck('path')->all();
        $disk = Storage::disk(config('filesystems.default'));

        DB::transaction(function () use ($product) {
            $product->images()->delete();
            $product->delete();
        });

        foreach ($paths as $path) {
            if (! preg_match('/^https?:\/\//i', $path) && $disk->exists($path) && ! $disk->delete($path)) {
                Log::error('Product image cleanup failed after product deletion.', ['product_id' => $product->id]);
                throw new RuntimeException('មិនអាចលុបឯកសាររូបភាពទាំងអស់បានទេ។');
            }
        }

        return response()->json(['message' => 'បានលុបម៉ូដរួចរាល់។']);
    }
}
