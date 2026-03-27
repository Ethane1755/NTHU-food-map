"use client";

import { useState } from "react";
import { X, Plus, MapPin, DollarSign, Tag, FileText, Image, Send } from "lucide-react";
import { CATEGORIES } from "@/modules/shared/lib/utils";

interface AddStoreFormData {
  name: string;
  category: string;
  address: string;
  description: string;
  price_range: number;
  phone: string;
  hours: string;
  image_url: string;
}

type PendingStoreSubmission = AddStoreFormData & {
  id: string;
  lat: number;
  lng: number;
  rating: null;
  created_at: string;
  status: "pending";
};

interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (storeData: PendingStoreSubmission) => void;
}

export default function AddStoreModal({ isOpen, onClose, onSubmit }: AddStoreModalProps) {
  const [formData, setFormData] = useState<AddStoreFormData>({
    name: "",
    category: "",
    address: "",
    description: "",
    price_range: 1,
    phone: "",
    hours: "",
    image_url: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category) return;

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newStore = {
      ...formData,
      id: `new_${Date.now()}`,
      lat: 24.7963 + (Math.random() - 0.5) * 0.01, // Random position near NTHU
      lng: 120.9964 + (Math.random() - 0.5) * 0.01,
      rating: null,
      created_at: new Date().toISOString(),
      status: "pending" as const, // Pending approval
    };

    onSubmit?.(newStore);
    setIsSubmitting(false);
    
    // Reset form
    setFormData({
      name: "",
      category: "",
      address: "",
      description: "",
      price_range: 1,
      phone: "",
      hours: "",
      image_url: "",
    });
    
    onClose();
  };

  const handleInputChange = <K extends keyof AddStoreFormData>(field: K, value: AddStoreFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">新增店家</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-4">
            {/* Store name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                店家名稱 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="請輸入店家名稱"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                類型 *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleInputChange("category", category)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      formData.category === category
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    <Tag size={14} />
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                地址
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="請輸入店家地址"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            {/* Price range */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                價位
              </label>
              <div className="flex gap-2">
                {[
                  { label: "$ ≤80元", value: 1 },
                  { label: "$$ ≤150元", value: 2 },
                  { label: "$$$ 150元+", value: 3 },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange("price_range", option.value)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      formData.price_range === option.value
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    <DollarSign size={14} />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                電話
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="請輸入聯絡電話"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            {/* Hours */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                營業時間
              </label>
              <input
                type="text"
                value={formData.hours}
                onChange={(e) => handleInputChange("hours", e.target.value)}
                placeholder="例：週一至週日 11:00-21:00"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                店家照片網址
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => handleInputChange("image_url", e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                店家描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="簡單描述這間店的特色..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
              />
            </div>
          </div>

          {/* Submit button */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={!formData.name.trim() || !formData.category || isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl transition-all active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Send size={18} />
                  提交審核
                </>
              )}
            </button>
            <p className="mt-2 text-xs text-gray-500 text-center">
              提交後將由管理員審核，通過後會顯示在地圖上
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
