<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class OutOfStockException extends Exception
{
    public function render(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'error_type' => 'OUT_OF_STOCK',
        ], 422);
    }
}
