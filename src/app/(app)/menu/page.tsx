'use client';

import React, { useState } from 'react';
import { Plus, Search, Filter, UtensilsCrossed, LayoutGrid, List as ListIcon } from 'lucide-react';
import { useStock } from '@/lib/StockContext';
import { Topbar } from '@/components/Topbar';
import { MenuItem, RecipeItem } from '@/types';
import { MenuCard } from './components/MenuCard';
import { MenuListView } from './components/MenuListView';
import { MenuModal } from './components/MenuModal';
import { Dropdown } from '@/components/Dropdown';

export default function RecipeMenuPage() {
  const { menuItems, ingredients, addMenuItem, updateMenuItem, deleteMenuItem } = useStock();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Search and Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('อาหารจานเดียว');
  const [price, setPrice] = useState<number | string>(89);
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);

  // Open modal for create
  const handleOpenCreate = () => {
    setEditingItem(null);
    setName('');
    setCategory('อาหารจานเดียว');
    setPrice(89);
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
      alert('กรุณากรอกชื่อเมนูอาหาร');
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
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/70">
      <Topbar
        title="สูตรอาหาร & เมนู (Recipe BOM Management)"
        subtitle="ผูกเมนูกับวัตถุดิบและสัดส่วนที่ใช้ต่อ 1 จาน พร้อมคำนวณต้นทุน/กำไรอัตโนมัติ"
      />

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Toolbar: Search, Category Filter, Card/List Switcher & Create button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อเมนู หรือรายละเอียด..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4fb0a5]/30 focus:border-[#4fb0a5] transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <Dropdown
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={[
                  { value: 'all', label: `ทุกหมวดหมู่ (${menuItems.length})` },
                  ...categories.map((cat) => ({ value: cat, label: cat })),
                ]}
                className="w-full sm:w-48"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end">
            {/* View Switcher: Card / List */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'card'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="มุมมองการ์ด (Card View)"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">การ์ด</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="มุมมองรายการ (List View)"
              >
                <ListIcon className="w-4 h-4" />
                <span className="hidden sm:inline">รายการ</span>
              </button>
            </div>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-2xl bg-[#4fb0a5] hover:bg-[#439e94] text-slate-950 font-bold text-xs shadow-lg shadow-[#4fb0a5]/20 flex items-center gap-2 transition-all transform active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" /> สร้างเมนู & ผูกสูตรใหม่
            </button>
          </div>
        </div>

        {/* Menu Items Render (Card View or List View) */}
        {filteredMenuItems.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-sm">
            <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            ไม่พบรายการเมนูที่ตรงกับเงื่อนไขการค้นหา
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
