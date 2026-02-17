<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Interfaces\ProductRepositoryInterface;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Requests\StoreProductRequest;


class ProductController extends Controller
{
    private $productRepository;

    public function __construct(ProductRepositoryInterface $productRepository)
    {
        $this->productRepository = $productRepository;
    }

    /**
     * Display a listing of products with filters
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'category'   => 'sometimes|exists:categories,id',
            'min_price'  => 'sometimes|numeric|min:0|lte:max_price',
            'max_price'  => 'sometimes|numeric|min:0|gte:min_price',
            'search'     => 'sometimes|string'
        ]);

        $products = $this->productRepository->getAll($validated);

        return response()->json([
            'success' => true,
            'data'    => $products
        ]);
    }

    /**
     * Dedicated search endpoint
     */
    public function search(Request $request)
    {
        $validated = $request->validate([
            'q' => 'required|string'
        ]);

        $products = $this->productRepository->getAll([
            'search' => $validated['q']
        ]);

        return response()->json([
            'success' => true,
            'data'    => $products
        ]);
    }

    /**
     * Store new product
     */
    public function store(StoreProductRequest $request)
{
    $product = $this->productRepository->create($request->validated());

    return response()->json([
        'success' => true,
        'data' => $product
    ], 201);
}

    /**
     * Show single product
     */
    public function show($id)
    {
        $product = $this->productRepository->findById($id);

        return response()->json([
            'success' => true,
            'data'    => $product
        ]);
    }

    /**
     * Update product
     */
    public function update(UpdateProductRequest $request, $id)
{
    $product = $this->productRepository->update($id, $request->validated());

    if (!$product) {
        return response()->json([
            'success' => false,
            'message' => 'Product not found'
        ], 404);
    }

    return response()->json([
        'success' => true,
        'data' => $product
    ]);
}


    /**
     * Delete product
     */
    public function destroy($id)
    {
        $this->productRepository->delete($id);

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully'
        ]);
    }
}
