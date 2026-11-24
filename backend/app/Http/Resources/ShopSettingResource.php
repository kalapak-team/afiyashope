<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ShopSettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'shop_name' => $this->shop_name,
            'shop_subtitle' => $this->shop_subtitle,
            'fb_url' => $this->fb_url,
            'avatar_url' => $this->imageUrl($this->avatar_path),
            'banner_url' => $this->imageUrl($this->banner_path),
            'protect_copy' => (bool) $this->protect_copy,
        ];
    }

    private function imageUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return preg_match('/^https?:\/\//i', $path)
            ? $path
            : Storage::disk(config('filesystems.default'))->url($path);
    }
}
