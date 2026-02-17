<?php

namespace App\Interfaces;

interface ProductRepositoryInterface
{
    public function getAll(array $filters);

    public function findById(int $id);

    public function create(array $data);

    public function update(int $id, array $data);

    public function delete(int $id);
}