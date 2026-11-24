<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ShopSetting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ShopSeeder extends Seeder
{
    public function run(): void
    {
        $email = trim((string) config('app.owner_email'));
        $password = (string) config('app.owner_password');

        ShopSetting::updateOrCreate(
            ['id' => 1],
            [
                'shop_name' => 'Afiya Shope',
                'shop_subtitle' => 'ហាង Abaya ប្រណិត និងទាន់សម័យនៅកម្ពុជា',
                'fb_url' => 'https://www.facebook.com/',
                'protect_copy' => false,
            ]
        );

        $samples = [
            ['ឈុត Pastel Sage', 'pastel', 45000, 50000, 'in_stock', 'ឈុត Abaya ពណ៌បៃតងស្រទន់ សាច់ក្រណាត់ទន់ និងស្រួលពាក់។'],
            ['ឈុត Rose Luxury', 'luxury', 59000, 65000, 'in_stock', 'ម៉ូដពណ៌ផ្កាឈូកប្រណិត សមស្របសម្រាប់កម្មវិធីពិសេស។'],
            ['ឈុតពេញពណ៌មេឃ', 'set', 52000, null, 'in_stock', 'ឈុតពេញពណ៌ខៀវផ្ទៃមេឃ ស្រាល និងទាន់សម័យ។'],
            ['ឈុត Lilac Pastel', 'pastel', 49000, 55000, 'out_of_stock', 'ម៉ូដពណ៌ស្វាយស្រាល សុភាពរាបសារ និងស្រស់ស្អាត។'],
        ];

        foreach ($samples as [$name, $tag, $price, $oldPrice, $stock, $description]) {
            Product::firstOrCreate(
                ['name' => $name],
                [
                    'tag' => $tag,
                    'price' => $price,
                    'old_price' => $oldPrice,
                    'stock' => $stock,
                    'description' => $description,
                ]
            );
        }

        if ($email === '' || $password === '' || str_contains($password, 'change_this')) {
            $this->command?->warn('Owner account not created. Set OWNER_EMAIL and OWNER_PASSWORD in backend/.env to enable admin login.');

            return;
        }

        User::updateOrCreate(
            ['email' => $email],
            ['name' => 'ម្ចាស់ហាង', 'password' => Hash::make($password)]
        );
    }
}
