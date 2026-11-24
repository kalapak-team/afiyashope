<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $disk = Storage::disk(config('filesystems.default'));

        return [
            'id' => $this->id,
            'name' => $this->name,
            'tag' => $this->tag,
            'price' => $this->price,
            'old_price' => $this->old_price,
            'stock' => $this->stock,
            'description' => $this->description,
            'images' => $this->whenLoaded('images', fn () => $this->images->map(fn ($image) => [
                'id' => $image->id,
                'url' => preg_match('/^https?:\/\//i', $image->path) ? $image->path : $disk->url($image->path),
                'sort_order' => $image->sort_order,
            ])->values()),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
