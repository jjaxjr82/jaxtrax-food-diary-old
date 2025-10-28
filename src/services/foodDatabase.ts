interface NutritionData {
  foodName: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

export const fetchNutritionByBarcode = async (barcode: string): Promise<NutritionData | null> => {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    
    if (!response.ok) {
      throw new Error("Product not found");
    }

    const data = await response.json();
    
    if (data.status !== 1 || !data.product) {
      return null;
    }

    const product = data.product;
    const nutriments = product.nutriments || {};

    // Get serving size or default to 100g
    const servingSize = product.serving_quantity || 100;
    const servingUnit = product.serving_quantity_unit || "g";

    // Helper function to capitalize food names properly
    const capitalizeWords = (str: string) => {
      return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    const productName = capitalizeWords(product.product_name || "Unknown Product");

    return {
      foodName: productName,
      quantity: `${servingSize}${servingUnit}`,
      calories: Math.round(nutriments['energy-kcal_100g'] || 0),
      protein: parseFloat((nutriments.proteins_100g || 0).toFixed(1)),
      carbs: parseFloat((nutriments.carbohydrates_100g || 0).toFixed(1)),
      fats: parseFloat((nutriments.fat_100g || 0).toFixed(1)),
      fiber: parseFloat((nutriments.fiber_100g || 0).toFixed(1)),
    };
  } catch (error) {
    console.error("Error fetching nutrition data:", error);
    return null;
  }
};
