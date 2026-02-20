import React, { useState, useEffect } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface LeadFilters {
  category?: string;
  subCategory?: string;
  minDistance?: number;
  maxDistance?: number;
  dateFrom?: string;
  dateTo?: string;
}

interface LeadFilterProps {
  onFiltersChange: (filters: LeadFilters) => void;
  activeFiltersCount?: number;
}

interface Category {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  name: string;
  category_id: string;
}

const LeadFilter: React.FC<LeadFilterProps> = ({ onFiltersChange, activeFiltersCount = 0 }) => {
  const { tc } = useLanguage();
  const [filters, setFilters] = useState<LeadFilters>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<SubCategory[]>([]);

  // Fetch categories and subcategories from Supabase
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      if (!error && data) {
        setCategories(data);
      }
    };

    const fetchSubCategories = async () => {
      const { data, error } = await supabase
        .from('sub_categories')
        .select('id, name, category_id')
        .order('name');
      if (!error && data) {
        setSubCategories(data as SubCategory[]);
      }
    };

    fetchCategories();
    fetchSubCategories();
  }, []);

  // Filter subcategories when category changes
  useEffect(() => {
    if (filters.category) {
      const selectedCategory = categories.find(c => c.name === filters.category);
      if (selectedCategory) {
        setFilteredSubCategories(
          subCategories.filter(sc => sc.category_id === selectedCategory.id)
        );
      } else {
        setFilteredSubCategories([]);
      }
    } else {
      setFilteredSubCategories([]);
    }
  }, [filters.category, categories, subCategories]);

  const handleCategoryChange = (value: string) => {
    const newFilters = {
      ...filters,
      category: value === 'all' ? undefined : value,
      subCategory: undefined, // Reset subcategory when category changes
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSubCategoryChange = (value: string) => {
    const newFilters = { ...filters, subCategory: value === 'all' ? undefined : value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleMinDistanceChange = (value: string) => {
    const newFilters = { ...filters, minDistance: value ? parseFloat(value) : undefined };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleMaxDistanceChange = (value: string) => {
    const newFilters = { ...filters, maxDistance: value ? parseFloat(value) : undefined };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDateFromChange = (value: string) => {
    const newFilters = { ...filters, dateFrom: value || undefined };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleDateToChange = (value: string) => {
    const newFilters = { ...filters, dateTo: value || undefined };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  return (
    <div className="w-full">
      <Button
        variant="outline"
        size="sm"
        className="relative w-full justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </span>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {isExpanded && (
        <div className="mt-3 p-4 bg-card border border-border rounded-xl space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Filter Leads</h3>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs h-auto py-1"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select
              value={filters.category || 'all'}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {tc(cat.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategory Filter */}
          {filters.category && filteredSubCategories.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Subcategory</label>
              <Select
                value={filters.subCategory || 'all'}
                onValueChange={handleSubCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {filteredSubCategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.name}>
                      {tc(sub.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Distance Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Distance (km)</label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minDistance || ''}
                onChange={(e) => handleMinDistanceChange(e.target.value)}
                min="0"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxDistance || ''}
                onChange={(e) => handleMaxDistanceChange(e.target.value)}
                min="0"
              />
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Created Date</label>
            <div className="space-y-2">
              <Input
                type="date"
                placeholder="From"
                value={filters.dateFrom || ''}
                onChange={(e) => handleDateFromChange(e.target.value)}
              />
              <Input
                type="date"
                placeholder="To"
                value={filters.dateTo || ''}
                onChange={(e) => handleDateToChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadFilter;
