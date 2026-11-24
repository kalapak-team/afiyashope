<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'shop_name' => ['required', 'string', 'max:100'],
            'shop_subtitle' => ['required', 'string', 'max:200'],
            'fb_url' => ['required', 'url', 'max:2048', 'regex:/^https:\/\/(www\.)?facebook\.com\//i'],
            'protect_copy' => ['required', 'boolean'],
        ];
    }
}
