<?php

namespace App\Repositories;

use App\Models\Product;
use App\Interfaces\ProductRepositoryInterface;

class ProductRepository implements ProductRepositoryInterface
{
    public function getAll(array $filters = [])
{
    $query = Product::with('category');
    if (!empty($filters['category'])) {
        $query->where('category_id', $filters['category']);
    }
    if (!empty($filters['min_price'])) {
        $query->where('price', '>=', $filters['min_price']);
    }

    if (!empty($filters['max_price'])) {
        $query->where('price', '<=', $filters['max_price']);
    }
    if (!empty($filters['search'])) {
        $query->where(function ($q) use ($filters) {
            $q->where('name', 'ILIKE', '%' . $filters['search'] . '%')
              ->orWhere('description', 'ILIKE', '%' . $filters['search'] . '%');
        });
    }
    return $query->paginate(10);
}

    public function findById(int $id)
    {
        return Product::with('category')->findOrFail($id);
    }

    public function create(array $data)
    {
        return Product::create($data);
    }

    public function update(int $id, array $data)
    {
        $product = Product::findOrFail($id);
        $product->update($data);

        return $product->load('category');
    }

    public function delete(int $id)
    {
        $product = Product::findOrFail($id);
        return $product->delete();
    }
}