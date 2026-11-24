<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'tag' => ['required', Rule::in(['pastel', 'luxury', 'set'])],
            'price' => ['required', 'integer', 'min:0'],
            'old_price' => ['nullable', 'integer', 'min:0'],
            'stock' => ['required', Rule::in(['in_stock', 'out_of_stock'])],
            'description' => ['nullable', 'string', 'max:10000'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'សូមបញ្ចូលឈ្មោះម៉ូដ។',
            'tag.in' => 'ប្រភេទម៉ូដមិនត្រឹមត្រូវទេ។',
            'price.required' => 'សូមបញ្ចូលតម្លៃ។',
            'price.integer' => 'តម្លៃត្រូវតែជាចំនួនគត់។',
            'stock.in' => 'ស្ថានភាពស្តុកមិនត្រឹមត្រូវទេ។',
        ];
    }
}
