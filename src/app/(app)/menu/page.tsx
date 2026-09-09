'use client';

import React, { useState } from 'react';
import { Plus, Search, Filter, Coffee, LayoutGrid, List as ListIcon } from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';
import { MenuItem, RecipeItem } from '@/types';
import { MenuCard } from './components/MenuCard';
import { MenuListView } from './components/MenuListView';
import { MenuModal } from './components/MenuModal';
import { Dropdown } from '@/components/Dropdown';
import { Button } from '@/components/Button';
import { Skeleton } from '@/components/Skeleton';

export default function RecipeMenuPage() {
  const { menuItems, ingredients, addMenuItem, updateMenuItem, deleteMenuItem, reorderMenuItems, isLoading } = useStock();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Search and Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('กาแฟ (Coffee)');
  const [price, setPrice] = useState<number | string>(65);
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);

  // Open modal for create
  const handleOpenCreate = () => {
    setEditingItem(null);
    setName('');
    setCategory('กาแฟ (Coffee)');
    setPrice(65);
    setImage('');
    setDescription('');
    setRecipes([{ ingredient_id: ingredients[0]?.id || 1, quantity_used: 0.1 }]);
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price);
    setImage(item.image || '');
    setDescription(item.description || '');
    setRecipes(item.recipes && item.recipes.length > 0 ? [...item.recipes] : [{ ingredient_id: ingredients[0]?.id || 1, quantity_used: 0.1 }]);
    setIsModalOpen(true);
  };

  // BOM helpers
  const handleAddRecipeRow = () => {
    setRecipes((prev) => [
      ...prev,
      { ingredient_id: ingredients[0]?.id || 1, quantity_used: 0.1 },
    ]);
  };

  const handleRemoveRecipeRow = (index: number) => {
    setRecipes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateRecipeRow = (index: number, field: string, value: any) => {
    setRecipes((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('กรุณากรอกชื่อเมนู');
      return;
    }

    const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
    if (numPrice <= 0) {
      alert('กรุณาระบุราคาขายที่มากกว่า 0');
      return;
    }

    // Filter valid recipes
    const formattedRecipes = recipes
      .map((r) => ({
        ingredient_id: Number(r.ingredient_id),
        quantity_used: typeof r.quantity_used === 'number' ? r.quantity_used : parseFloat(r.quantity_used as any) || 0.01,
      }))
      .filter((r) => r.ingredient_id && r.quantity_used > 0);

    if (formattedRecipes.length === 0) {
      alert('กรุณาระบุวัตถุดิบและสัดส่วนอย่างน้อย 1 รายการ');
      return;
    }

    let success = false;
    if (editingItem) {
      success = await updateMenuItem(editingItem.id, {
        name: name.trim(),
        category,
        price: numPrice,
        image: image.trim() || undefined,
        description: description.trim(),
        recipes: formattedRecipes,
      });
    } else {
      success = await addMenuItem({
        name: name.trim(),
        category,
        price: numPrice,
        image: image.trim() || undefined,
        description: description.trim(),
        recipes: formattedRecipes,
      });
    }

    if (success) {
      setIsModalOpen(false);
    } else {
      alert('บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Filter items
  const categories = Array.from(new Set(menuItems.map((m) => m.category)));
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#faf9f5]">
      <Topbar
        title="เมนู & สูตรชง (Recipe BOM)"
        subtitle="ผูกเมนูกับวัตถุดิบและสูตรชง/เสิร์ฟ พร้อมคำนวณต้นทุนและกำไรต่อแก้วอัตโนมัติ"
      />

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Toolbar: Search, Category Filter, Card/List Switcher & Create button */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/90 shadow-2xs">
          {/* Left Controls: Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
            {/* Search */}
            <div className="relative flex-1 min-w-[160px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="ค้นหาชื่อเมนู หรือรายละเอียด..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full pl-9 pr-4 text-xs sm:text-sm rounded-xl bg-white border border-stone-200/90 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors font-normal shadow-2xs"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Dropdown
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={[
                  { value: 'all', label: `ทุกหมวดหมู่ (${menuItems.length})` },
                  ...categories.map((cat) => ({ value: cat, label: cat })),
                ]}
                size="md"
                className="w-full sm:w-48"
                buttonClassName="border-stone-200/90 bg-white hover:bg-stone-50 text-stone-700 shadow-2xs"
              />
            </div>
          </div>

          {/* Right Controls: View Switcher & Add Button */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
            {/* View Switcher: Card / List */}
            <div className="bg-stone-100 p-1 rounded-xl flex items-center gap-1 shrink-0 border border-stone-200/60">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'card'
                    ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
                title="มุมมองการ์ด (Card View)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">การ์ด</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
                title="มุมมองรายการ (List View)"
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">รายการ</span>
              </button>
            </div>

            {/* Add Button */}
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenCreate}
              icon={<Plus className="w-4 h-4" />}
              className="shrink-0 whitespace-nowrap shadow-xs bg-stone-900 text-white hover:bg-stone-800 rounded-xl"
            >
              เพิ่มเมนูใหม่
            </Button>
          </div>
        </div>

        {/* Menu Items Render (Card View or List View) */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200/90 p-5 space-y-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <div className="pt-3 border-t border-stone-100 flex justify-between items-center">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMenuItems.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-stone-200/90 text-stone-400 text-sm shadow-xs">
            <Coffee className="w-8 h-8 mx-auto mb-2 opacity-40 text-stone-400" />
            ไม่พบรายการเมนูที่ค้นหา
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenuItems.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                onEdit={handleOpenEdit}
                onDelete={deleteMenuItem}
              />
            ))}
          </div>
        ) : (
          <MenuListView
            items={filteredMenuItems}
            onEdit={handleOpenEdit}
            onDelete={deleteMenuItem}
            onReorder={reorderMenuItems}
          />
        )}
      </main>

      {/* Modular Reusable Menu Modal */}
      <MenuModal
        isOpen={isModalOpen}
        editingItem={editingItem}
        name={name}
        category={category}
        price={price}
        image={image}
        description={description}
        recipes={recipes}
        ingredients={ingredients}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        setName={setName}
        setCategory={setCategory}
        setPrice={setPrice}
        setImage={setImage}
        setDescription={setDescription}
        onAddRecipeRow={handleAddRecipeRow}
        onRemoveRecipeRow={handleRemoveRecipeRow}
        onUpdateRecipeRow={handleUpdateRecipeRow}
      />
    </div>
  );
}
