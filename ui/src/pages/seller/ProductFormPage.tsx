import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import API, { type CreateProductInput, type UpdateProductInput, ProductStatus } from '@/api/api';
import { ArrowLeft, Save, Trash2, Package } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

const CATEGORIES = [
  'electronics',
  'clothing',
  'home',
  'sports',
  'books',
  'toys',
  'beauty',
  'food',
];

export default function ProductFormPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { user } = useAuthStore();
  const isEditMode = !!productId;

  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Product form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'electronics',
    price: '',
    currency: 'USD',
    sku: '',
    imageUrl: '',
    status: 'ACTIVE' as keyof typeof ProductStatus,
  });

  // Inventory state
  const [inventoryData, setInventoryData] = useState({
    currentQuantity: 0,
    quantityChange: '',
  });

  useEffect(() => {
    // Verify user is a seller
    if (user?.role !== 'SELLER') {
      navigate('/home');
      return;
    }

    if (isEditMode && productId) {
      fetchProduct();
      fetchInventory();
    }
  }, [user, navigate, isEditMode, productId]);

  const fetchProduct = async () => {
    if (!productId) return;

    try {
      setLoadingProduct(true);
      const product = await API.graphql.getProduct(productId);
      
      setFormData({
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price.toString(),
        currency: product.currency,
        sku: product.sku,
        imageUrl: product.imageUrl || '',
        status: product.status as keyof typeof ProductStatus,
      });
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to load product details');
    } finally {
      setLoadingProduct(false);
    }
  };

  const fetchInventory = async () => {
    if (!productId) return;

    try {
      const inventory = await API.inventory.getByProductId(productId);
      setInventoryData(prev => ({
        ...prev,
        currentQuantity: inventory.quantity,
      }));
    } catch (err) {
      console.error('Error fetching inventory:', err);
      // Inventory might not exist yet, that's okay
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEditMode && productId) {
        // Update existing product
        const updateInput: UpdateProductInput = {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: parseFloat(formData.price),
          currency: formData.currency,
          sku: formData.sku,
          imageUrl: formData.imageUrl || undefined,
          status: formData.status as any,
        };

        const result = await API.graphql.updateProduct(productId, updateInput);
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to update product');
        }

        // Update inventory if there's a change
        if (inventoryData.quantityChange) {
          const changeAmount = parseInt(inventoryData.quantityChange);
          await API.inventory.updateInventory({ productId, quantity: changeAmount });
        }

        navigate('/seller/products');
      } else {
        // Create new product
        const createInput: CreateProductInput = {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: parseFloat(formData.price),
          currency: formData.currency,
          sku: formData.sku,
          imageUrl: formData.imageUrl || undefined,
        };

        const result = await API.graphql.createProduct(createInput);
        
        if (!result.success || !result.product) {
          throw new Error(result.message || 'Failed to create product');
        }

        // Create initial inventory
        if (inventoryData.quantityChange) {
          const quantity = parseInt(inventoryData.quantityChange);
          if (quantity > 0) {
            await API.inventory.updateInventory(
              {
                productId: result.product.id,
                quantity: quantity,
              }
            );
          }
        }

        navigate('/seller/products');
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error saving product:', error);
      setError(error.message || 'Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!productId) return;

    setLoading(true);
    try {
      await API.graphql.deleteProduct(productId);
      navigate('/seller/products');
    } catch (err) {
      const error = err as Error;
      console.error('Error deleting product:', error);
      setError(error.message || 'Failed to delete product');
      setShowDeleteDialog(false);
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-64 bg-muted rounded" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/seller/products')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">
                {isEditMode ? 'Edit Product' : 'Add New Product'}
              </h1>
              <p className="text-muted-foreground">
                {isEditMode
                  ? 'Update product details and inventory'
                  : 'Create a new product listing'}
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Details Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Product Details</h2>
              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter product name"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter product description"
                    required
                    rows={4}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full h-10 px-3 border rounded-md bg-background"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price & Currency */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency *</Label>
                    <select
                      id="currency"
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      required
                      className="w-full h-10 px-3 border rounded-md bg-background"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="INR">INR</option>
                    </select>
                  </div>
                </div>

                {/* SKU */}
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="Enter SKU"
                    required
                  />
                </div>

                {/* Image URL */}
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    name="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Status (Edit mode only) */}
                {isEditMode && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                      className="w-full h-10 px-3 border rounded-md bg-background"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="OUT_OF_STOCK">Out of Stock</option>
                    </select>
                  </div>
                )}
              </div>
            </Card>

            {/* Inventory Card */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Inventory Management</h2>
              </div>
              <div className="space-y-4">
                {isEditMode && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Current Stock</p>
                    <p className="text-2xl font-bold">{inventoryData.currentQuantity} units</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="quantityChange">
                    {isEditMode ? 'Adjust Quantity' : 'Initial Stock Quantity'}
                  </Label>
                  <Input
                    id="quantityChange"
                    name="quantityChange"
                    type="number"
                    value={inventoryData.quantityChange}
                    onChange={(e) =>
                      setInventoryData(prev => ({
                        ...prev,
                        quantityChange: e.target.value,
                      }))
                    }
                    placeholder={isEditMode ? 'Enter +/- amount (e.g., +10 or -5)' : 'Enter initial quantity'}
                  />
                  {isEditMode && (
                    <p className="text-xs text-muted-foreground">
                      Use positive numbers to add stock (e.g., 10) or negative to reduce (e.g., -5)
                    </p>
                  )}
                </div>

                {isEditMode && inventoryData.quantityChange && (
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <p className="text-sm font-medium">
                      New Stock Level:{' '}
                      <span className="text-primary text-lg">
                        {inventoryData.currentQuantity + parseInt(inventoryData.quantityChange || '0')} units
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div>
                {isEditMode && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Product
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/seller/products')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={handleDelete}
        confirmText="Delete"
        variant="destructive"
      />
    </MainLayout>
  );
}
