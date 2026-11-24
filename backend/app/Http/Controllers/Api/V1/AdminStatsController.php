<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class AdminStatsController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'total' => Product::query()->count(),
            'in_stock' => Product::query()->where('stock', 'in_stock')->count(),
            'out_of_stock' => Product::query()->where('stock', 'out_of_stock')->count(),
        ]);
    }
}
