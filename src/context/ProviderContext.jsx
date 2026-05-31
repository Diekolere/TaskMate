import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, uploadFile, generateFilePath } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { toast } from 'sonner';

const formatProviderCategory = (tradeCategoryArray, fallbackCategory) => {
  if (tradeCategoryArray && Array.isArray(tradeCategoryArray) && tradeCategoryArray.length > 0) {
    if (tradeCategoryArray.length === 1) return tradeCategoryArray[0];
    return `${tradeCategoryArray[0]} + ${tradeCategoryArray.length - 1}`;
  }
  if (fallbackCategory && fallbackCategory !== 'General Service' && fallbackCategory !== 'None') {
    return fallbackCategory;
  }
  return 'None';
};

const ProviderContext = createContext({
  savedProviderIds: [],
  getProviders: async () => [],
  getProviderProfile: async () => null,
  getInterestedProviders: async () => [],
  toggleSavedProvider: async () => {},
  submitReview: async () => {},
  createServicePost: async () => {},
  updateServicePost: async () => {},
  deleteServicePost: async () => {},
  getServicePosts: async () => [],
  getAllServicePosts: async () => [],
  getAvailableCategories: async () => [],
});

export function useProvider() {
  return useContext(ProviderContext);
}

export function ProviderProvider({ children }) {
  const { currentUser } = useAuth();
  const { sendNotification } = useNotifications();
  const [savedProviderIds, setSavedProviderIds] = useState([]);

  useEffect(() => {
    if (currentUser?.role === 'customer') {
      setSavedProviderIds(currentUser.saved_workers || []);
    }
  }, [currentUser]);

  const getProviders = useCallback(async (category = null) => {
    try {
      let selectStr = '*, provider_profiles(*)';
      if (category && category !== 'All') {
        selectStr = '*, provider_profiles!inner(*)';
      }
      let query = supabase
        .from('profiles')
        .select(selectStr)
        .eq('role', 'provider')
        .eq('is_active', true);

      if (category && category !== 'All') {
        const capitalized = category.charAt(0).toUpperCase() + category.slice(1);
        const lower = category.toLowerCase();
        query = query.or(`trade_category.cs.{"${capitalized}"},trade_category.cs.{"${lower}"}`, { foreignTable: 'provider_profiles' });
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(p => {
        const profile = Array.isArray(p.provider_profiles)
          ? (p.provider_profiles[0] || {})
          : (p.provider_profiles || {});
        return {
          ...p,
          ...profile,
          uid: p.id,
          displayName: p.full_name,
          photoURL: p.avatar_url,
          category: formatProviderCategory(profile.trade_category, profile.category),
          trade_category: profile.trade_category || [],
          rating: profile.average_rating ?? null,
          isVerified: profile.verification_status === 'verified'
        };
      });
    } catch (error) {
      console.error('Get providers error:', error);
      return [];
    }
  }, []);

  const getProviderProfile = useCallback(async (providerId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, provider_profiles(*), reviews:reviews!provider_id(*, reviewer:profiles!reviewer_id(full_name, avatar_url))')
        .eq('id', providerId)
        .single();

      if (error) throw error;
      if (!data) return null;

      const profile = Array.isArray(data.provider_profiles)
        ? (data.provider_profiles[0] || {})
        : (data.provider_profiles || {});
      return {
        ...data,
        ...profile,
        uid: data.id,
        displayName: data.full_name,
        photoURL: data.avatar_url,
        category: formatProviderCategory(profile.trade_category, profile.category),
        trade_category: profile.trade_category || [],
        rating: profile.average_rating ?? null,
        isVerified: profile.verification_status === 'verified'
      };
    } catch (error) {
      console.error('Get provider profile error:', error);
      return null;
    }
  }, []);

  const getInterestedProviders = useCallback(async (jobId) => {
    try {
      const { data: applications, error: appError } = await supabase
        .from('job_applications')
        .select('provider_id, proposed_price')
        .eq('job_id', jobId)
        .in('status', ['accepted', 'negotiating']);

      if (appError) throw appError;
      if (!applications || applications.length === 0) return [];

      const providerMap = new Map();
      applications.forEach(app => {
        providerMap.set(app.provider_id, app.proposed_price);
      });

      const { data: providers, error: provError } = await supabase
        .from('profiles')
        .select('*, provider_profiles(*)')
        .in('id', Array.from(providerMap.keys()));

      if (provError) throw provError;

      return (providers || []).map(p => {
        const profile = Array.isArray(p.provider_profiles)
          ? (p.provider_profiles[0] || {})
          : (p.provider_profiles || {});
        return {
          ...p,
          ...profile,
          uid: p.id,
          displayName: p.full_name,
          photoURL: p.avatar_url,
          category: formatProviderCategory(profile.trade_category, profile.category),
          trade_category: profile.trade_category || [],
          rating: profile.average_rating ?? null,
          proposed_price: providerMap.get(p.id),
          isVerified: profile.verification_status === 'verified'
        };
      });
    } catch (error) {
      console.error('Get interested providers error:', error);
      return [];
    }
  }, []);

  const toggleSavedProvider = async (providerId) => {
    if (!currentUser) return;

    let newSavedIds = [...savedProviderIds];
    if (newSavedIds.includes(providerId)) {
      newSavedIds = newSavedIds.filter(id => id !== providerId);
      toast.success('Provider removed from favorites');
    } else {
      newSavedIds.push(providerId);
      toast.success('Provider saved!');
      
      sendNotification(providerId, {
        type: 'system',
        title: 'New Profile Save!',
        body: 'A customer has saved your profile to their favorites.',
        icon: 'favorite',
        iconBg: 'bg-red-50',
        iconColor: 'text-red-500'
      }).catch(console.error);
    }

    const { error } = await supabase
      .from('customer_profiles')
      .update({ saved_workers: newSavedIds })
      .eq('id', currentUser.id);

    if (error) { toast.error('Failed to update favorites'); }
    else { setSavedProviderIds(newSavedIds); }
  };

  const submitReview = async (jobId, providerId, rating, comment, tags = []) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase.from('reviews').insert([{
        job_id: jobId, reviewer_id: currentUser.id, provider_id: providerId,
        rating, comment, tags
      }]);
      if (error) throw error;

      const { data: allReviews } = await supabase.from('reviews').select('rating').eq('provider_id', providerId);
      if (allReviews && allReviews.length > 0) {
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        await supabase.from('provider_profiles').update({ average_rating: parseFloat(avg.toFixed(1)) }).eq('id', providerId);
      }

      toast.success('Review submitted!');

      sendNotification(providerId, {
        type: 'review',
        title: `You received a ${rating}-star review!`,
        body: comment ? (comment.length > 50 ? comment.substring(0, 50) + '...' : comment) : 'A customer just reviewed your work.',
        icon: 'star',
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-500',
        ctaPath: '/provider/profile',
        ctaLabel: 'View Profile'
      }).catch(console.error);
    } catch (error) {
      console.error('Submit review error:', error);
      toast.error('Failed to submit review');
      throw error;
    }
  };

  const createServicePost = async (postData) => {
    if (!currentUser) return;

    try {
      let imageUrls = [];
      if (postData.imageFiles?.length > 0) {
        for (const file of postData.imageFiles) {
          const path = generateFilePath(currentUser.id, file.name);
          const url = await uploadFile('service-posts', path, file);
          imageUrls.push(url);
        }
      }

      const { data, error } = await supabase.from('service_posts').insert([{
        provider_id: currentUser.id, 
        caption: postData.caption,
        images: imageUrls.length > 0 ? imageUrls : (postData.images || []), 
        tags: postData.tags || [], 
        category: postData.category,
        location: postData.location
      }]).select().single();

      if (error) throw error;
      toast.success('Post created!');
      return data.id;
    } catch (error) {
      console.error('Create post error:', error);
      toast.error('Failed to create post');
      throw error;
    }
  };

  const updateServicePost = async (postId, postData) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('service_posts')
        .update({
          caption: postData.caption,
          images: postData.images,
          tags: postData.tags,
          category: postData.category,
          location: postData.location
        })
        .eq('id', postId)
        .eq('provider_id', currentUser.id);

      if (error) throw error;
      toast.success('Post updated!');
    } catch (error) {
      console.error('Update post error:', error);
      toast.error('Failed to update post');
      throw error;
    }
  };

  const deleteServicePost = async (postId) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('service_posts')
        .delete()
        .eq('id', postId)
        .eq('provider_id', currentUser.id);

      if (error) throw error;
      toast.success('Post deleted!');
    } catch (error) {
      console.error('Delete post error:', error);
      toast.error('Failed to delete post');
      throw error;
    }
  };

  const getServicePosts = async (providerId) => {
    const { data } = await supabase
      .from('service_posts')
      .select('*, profiles(full_name, avatar_url, location_name)')
      .eq('provider_id', providerId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    return data || [];
  };

  const getAllServicePosts = async (category = null) => {
    let query = supabase
      .from('service_posts')
      .select('*, profiles(full_name, avatar_url, location_name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    const { data } = await query;
    return data || [];
  };

  const getAvailableCategories = useCallback(async () => {
    try {
      const providers = await getProviders('All');
      const available = new Set();
      providers.forEach(p => {
        if (p.trade_category && Array.isArray(p.trade_category) && p.trade_category.length > 0) {
          p.trade_category.forEach(cat => available.add(cat.toLowerCase()));
        } else if (p.category && p.category !== 'None') {
          available.add(p.category.toLowerCase());
        }
      });
      return Array.from(available);
    } catch (err) {
      console.error('Error fetching available categories:', err);
      return [];
    }
  }, [getProviders]);

  const value = {
    savedProviderIds, getProviders, getProviderProfile, getInterestedProviders,
    toggleSavedProvider, submitReview, createServicePost, updateServicePost,
    deleteServicePost, getServicePosts, getAllServicePosts, getAvailableCategories
  };

  return (
    <ProviderContext.Provider value={value}>
      {children}
    </ProviderContext.Provider>
  );
}
