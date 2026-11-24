<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class DemoProductsSeeder extends Seeder
{
    public function run(): void
    {
        $colors = ['ក្រែម', 'បៃតងស្រទន់', 'ផ្កាឈូក', 'ខៀវមេឃ', 'ស្វាយស្រាល', 'ត្នោត', 'ប្រផេះ', 'ខ្មៅ', 'ស', 'មាស'];
        $styles = ['កាត់ត្រង់', 'ដៃផ្លុំ', 'ប៉ាក់លម្អ', 'ខ្សែក្រវ៉ាត់', 'ម៉ូដសាមញ្ញ'];
        $tags = ['pastel', 'luxury', 'set'];

        for ($index = 0; $index < 50; $index++) {
            $color = $colors[intdiv($index, count($styles))];
            $style = $styles[$index % count($styles)];
            $tag = $tags[$index % count($tags)];
            $name = $tag === 'set'
                ? "ឈុតពេញពណ៌{$color} {$style}"
                : "អាបាយ៉ាពណ៌{$color} {$style}";
            $price = 42000 + ($index * 1250);

            Product::firstOrCreate(
                ['name' => $name],
                [
                    'tag' => $tag,
                    'price' => $price,
                    'old_price' => $index % 3 === 0 ? $price + 5000 : null,
                    'stock' => $index % 7 === 0 ? 'out_of_stock' : 'in_stock',
                    'description' => "ម៉ូដ{$style} ពណ៌{$color} សាច់ក្រណាត់ទន់ ស្រួលពាក់ និងសមស្របសម្រាប់គ្រប់ឱកាស។",
                ]
            );
        }
    }
}
