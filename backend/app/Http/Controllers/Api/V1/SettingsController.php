<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpdateSettingsRequest;
use App\Http\Requests\Api\UploadAvatarRequest;
use App\Http\Requests\Api\UploadBannerRequest;
use App\Http\Resources\ShopSettingResource;
use App\Models\ShopSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class SettingsController extends Controller
{
    public function show(): ShopSettingResource
    {
        return new ShopSettingResource(ShopSetting::firstOrFail());
    }

    public function update(UpdateSettingsRequest $request): ShopSettingResource
    {
        $settings = ShopSetting::firstOrFail();
        $settings->update($request->validated());

        return new ShopSettingResource($settings->refresh());
    }

    public function avatar(UploadAvatarRequest $request): ShopSettingResource
    {
        return $this->replaceImage($request, 'avatar', 'avatar_path', 'រូបតំណាង');
    }

    public function banner(UploadBannerRequest $request): ShopSettingResource
    {
        return $this->replaceImage($request, 'banner', 'banner_path', 'រូបភាពបដា');
    }

    private function replaceImage(Request $request, string $field, string $column, string $label): ShopSettingResource
    {
        $settings = ShopSetting::firstOrFail();
        $file = $request->file($field);
        if (! $file) {
            throw new RuntimeException("មិនមានឯកសារ{$label}សម្រាប់ផ្ទុកឡើយ។");
        }

        $diskName = config('filesystems.default');
        $newPath = $file->store("settings/{$field}", $diskName);
        if (! is_string($newPath) || $newPath === '') {
            throw new RuntimeException("មិនអាចរក្សាទុក{$label}បានទេ។");
        }

        $oldPath = $settings->{$column};
        DB::transaction(fn () => $settings->update([$column => $newPath]));

        $disk = Storage::disk($diskName);
        if ($oldPath && ! preg_match('/^https?:\/\//i', $oldPath) && $disk->exists($oldPath) && ! $disk->delete($oldPath)) {
            Log::error('Old shop image cleanup failed.', ['setting_id' => $settings->id, 'column' => $column]);
            throw new RuntimeException("បានរក្សាទុក{$label}ថ្មី ប៉ុន្តែមិនអាចលុបរូបចាស់បានទេ។");
        }

        return new ShopSettingResource($settings->refresh());
    }
}
