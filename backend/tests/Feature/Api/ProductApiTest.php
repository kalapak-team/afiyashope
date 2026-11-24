<?php

namespace Tests\Feature\Api;

use App\Models\Product;
use App\Models\ShopSetting;
use App\Models\User;
use Database\Seeders\DemoProductsSeeder;
use Database\Seeders\ShopSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.owner_email' => 'owner@example.com']);
        ShopSetting::create([
            'shop_name' => 'Afiya Shope',
            'shop_subtitle' => 'ហាង Abaya',
            'fb_url' => 'https://www.facebook.com/afiya',
        ]);
    }

    public function test_owner_can_login_and_create_a_product(): void
    {
        User::factory()->create([
            'name' => 'ម្ចាស់ហាង',
            'email' => 'owner@example.com',
            'password' => 'StrongTest123!',
        ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'owner@example.com',
            'password' => 'StrongTest123!',
        ])->assertOk()->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);

        $this->withToken($login->json('token'))->postJson('/api/v1/admin/products', [
            'name' => 'ឈុត Pastel',
            'tag' => 'pastel',
            'price' => 45000,
            'old_price' => 50000,
            'stock' => 'in_stock',
            'description' => 'ឈុត Abaya ប្រណិត',
        ])->assertCreated()->assertJsonPath('data.name', 'ឈុត Pastel');

        $this->assertDatabaseHas('products', ['name' => 'ឈុត Pastel', 'price' => 45000]);
    }

    public function test_admin_product_routes_require_an_owner_token(): void
    {
        $nonOwner = User::factory()->create(['email' => 'visitor@example.com']);

        $this->actingAs($nonOwner, 'sanctum')
            ->postJson('/api/v1/admin/products', [
                'name' => 'Not allowed',
                'tag' => 'pastel',
                'price' => 1,
                'stock' => 'in_stock',
            ])
            ->assertForbidden();

        auth()->forgetGuards();
        $this->postJson('/api/v1/admin/products', [
            'name' => 'Not authenticated',
            'tag' => 'pastel',
            'price' => 1,
            'stock' => 'in_stock',
        ])->assertUnauthorized();
    }

    public function test_public_product_list_filters_search_tag_and_paginates(): void
    {
        Product::create([
            'name' => 'Pastel Sage',
            'tag' => 'pastel',
            'price' => 45000,
            'stock' => 'in_stock',
            'description' => 'soft green fabric',
        ]);
        Product::create([
            'name' => 'Luxury Rose',
            'tag' => 'luxury',
            'price' => 59000,
            'stock' => 'out_of_stock',
        ]);

        $this->getJson('/api/v1/products?search=PASTEL&tag=pastel&per_page=1')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.name', 'Pastel Sage')
            ->assertJsonPath('data.0.stock', 'in_stock');

        $this->getJson('/api/v1/products?per_page=0')->assertUnprocessable();
    }

    public function test_owner_can_update_and_soft_delete_product(): void
    {
        $owner = User::factory()->create(['email' => 'owner@example.com']);
        $product = Product::create([
            'name' => 'Before',
            'tag' => 'set',
            'price' => 100,
            'stock' => 'in_stock',
        ]);

        $this->actingAs($owner, 'sanctum')
            ->putJson("/api/v1/admin/products/{$product->id}", [
                'name' => 'After',
                'tag' => 'luxury',
                'price' => 200,
                'stock' => 'out_of_stock',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'After');

        $this->actingAs($owner, 'sanctum')
            ->deleteJson("/api/v1/admin/products/{$product->id}")
            ->assertOk();

        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }

    public function test_demo_products_seeder_creates_fifty_products_and_can_be_repeated(): void
    {
        $this->seed(DemoProductsSeeder::class);
        $this->assertDatabaseCount('products', 50);

        $this->seed(DemoProductsSeeder::class);
        $this->assertDatabaseCount('products', 50);
    }

    public function test_shop_seeder_creates_public_settings_without_owner_credentials(): void
    {
        config(['app.owner_email' => '', 'app.owner_password' => '']);

        $this->seed(ShopSeeder::class);

        $this->assertDatabaseCount('products', 4);
        $this->assertDatabaseHas('settings', ['shop_name' => 'Afiya Shope']);
        $this->getJson('/api/v1/settings')
            ->assertOk()
            ->assertJsonPath('data.shop_name', 'Afiya Shope');
    }

    public function test_owner_can_upload_and_replace_the_public_hero_banner(): void
    {
        $owner = User::factory()->create(['email' => 'owner@example.com']);
        Storage::fake('public');
        config(['filesystems.default' => 'public']);

        $firstUpload = $this->actingAs($owner, 'sanctum')
            ->postJson('/api/v1/admin/settings/banner', [
                'banner' => UploadedFile::fake()->image('hero.jpg'),
            ])
            ->assertOk()
            ->assertJsonStructure(['data' => ['banner_url']]);

        $firstPath = ShopSetting::firstOrFail()->banner_path;
        Storage::disk('public')->assertExists($firstPath);

        $secondUpload = $this->actingAs($owner, 'sanctum')
            ->postJson('/api/v1/admin/settings/banner', [
                'banner' => UploadedFile::fake()->image('new-hero.jpg'),
            ])
            ->assertOk();

        Storage::disk('public')->assertMissing($firstPath);
        $this->getJson('/api/v1/settings')
            ->assertOk()
            ->assertJsonPath('data.banner_url', $secondUpload->json('data.banner_url'));
    }
}
