<?php

namespace App\Repositories;

use App\Models\Category;
// use App\Interfaces\CategoryRepositoryInterface;

class CategoryRepository // implements CategoryRepositoryInterface
{
    public function getAll()
    {
        return Category::withCount('products')->paginate(10);
    }

    public function findById(int $id)
    {
        return Category::with('products')->findOrFail($id);
    }

    public function create(array $data)
    {
        $category = new Category();
        $category->name = $data['name'];
        $category->description = $data['description'] ?? null;
        $category->save();

        return $category;
    }

    public function update(int $id, array $data)
    {
        $category = Category::findOrFail($id);

        if (array_key_exists('name', $data)) {
            $category->name = $data['name'];
        }

        if (array_key_exists('description', $data)) {
            $category->description = $data['description'];
        }

        $category->save();

        return $category;
    }

    public function delete(int $id)
    {
        $category = Category::findOrFail($id);
        return $category->delete();
    }
}
