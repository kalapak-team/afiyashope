<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('tag', 20)->index();
            $table->integer('price');
            $table->integer('old_price')->nullable();
            $table->string('stock', 20)->default('in_stock')->index();
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('name');
        });

        DB::statement("ALTER TABLE products ADD CONSTRAINT products_tag_check CHECK (tag IN ('pastel', 'luxury', 'set'))");
        DB::statement("ALTER TABLE products ADD CONSTRAINT products_stock_check CHECK (stock IN ('in_stock', 'out_of_stock'))");
        DB::statement('ALTER TABLE products ADD CONSTRAINT products_price_check CHECK (price >= 0 AND (old_price IS NULL OR old_price >= 0))');

        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('path', 2048);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->index(['product_id', 'sort_order']);
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('shop_name', 100);
            $table->string('shop_subtitle', 200)->default('');
            $table->string('fb_url', 2048);
            $table->string('avatar_path', 2048)->nullable();
            $table->boolean('protect_copy')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
        Schema::dropIfExists('product_images');
        Schema::dropIfExists('products');
    }
};
