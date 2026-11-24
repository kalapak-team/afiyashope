<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShopSetting extends Model
{
    protected $table = 'settings';

    protected $fillable = [
        'shop_name',
        'shop_subtitle',
        'fb_url',
        'avatar_path',
        'banner_path',
        'protect_copy',
    ];

    protected function casts(): array
    {
        return ['protect_copy' => 'boolean'];
    }
}
