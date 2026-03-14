import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUp, ArrowDown, ImagePlus, RefreshCw, Trash2, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';

type Banner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  cta_text: string | null;
  cta_link: string | null;
  is_active: boolean;
  display_order: number;
};

const emptyForm = {
  title: '',
  subtitle: '',
  cta_text: 'SHOP NOW',
  cta_link: '/shop',
  is_active: true,
  display_order: 0,
};

const parseResponse = async (res: Response) => {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
};

const extractError = (data: any, fallback: string) => {
  if (data?.error && typeof data.error === 'string') return data.error;
  if (data?.message && typeof data.message === 'string') return data.message;
  return fallback;
};

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImageUrl, setExistingImageUrl] = useState('');

  const adminKey = localStorage.getItem('adminKey') || '';

  const fetchBanners = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:3001/api/admin/banners', {
        headers: { 'x-admin-key': adminKey },
      });
      const data = await parseResponse(res);
      if (!res.ok) {
        throw new Error(extractError(data, 'Failed to fetch banners'));
      }
      setBanners(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminKey) {
      window.location.href = '/login';
      return;
    }
    fetchBanners();
  }, []);

  const orderedBanners = useMemo(
    () => [...banners].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    [banners],
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setImageFiles([]);
    setExistingImageUrl('');
  };

  const handleSave = async () => {
    if (imageFiles.length === 0 && !existingImageUrl) {
      setError('Please upload a banner image');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = new FormData();
      payload.append('title', form.title || '');
      payload.append('subtitle', form.subtitle || '');
      payload.append('cta_text', form.cta_text || 'SHOP NOW');
      payload.append('cta_link', form.cta_link || '/shop');
      payload.append('is_active', String(form.is_active));
      payload.append('display_order', String(Number(form.display_order || 0)));
      if (existingImageUrl) payload.append('existing_image_url', existingImageUrl);
      if (editId) {
        if (imageFiles[0]) payload.append('image', imageFiles[0]);
      } else {
        imageFiles.forEach((file) => payload.append('images', file));
      }

      const url = editId
        ? `http://localhost:3001/api/admin/banners/${editId}`
        : 'http://localhost:3001/api/admin/banners';

      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: {
          'x-admin-key': adminKey,
        },
        body: payload,
      });
      const data = await parseResponse(res);

      if (!res.ok) {
        throw new Error(extractError(data, 'Failed to save banner'));
      }

      await fetchBanners();
      resetForm();
    } catch (err: any) {
      setError(err?.message || 'Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this banner slide?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/admin/banners/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      });
      const data = await parseResponse(res);
      if (!res.ok) {
        throw new Error(extractError(data, 'Failed to delete banner'));
      }
      await fetchBanners();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete banner');
    }
  };

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const index = orderedBanners.findIndex((banner) => banner.id === id);
    const next = direction === 'up' ? index - 1 : index + 1;
    if (index < 0 || next < 0 || next >= orderedBanners.length) return;

    const reordered = [...orderedBanners];
    const [item] = reordered.splice(index, 1);
    reordered.splice(next, 0, item);
    setBanners(reordered);

    try {
      const res = await fetch('http://localhost:3001/api/admin/banners/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({ bannerIds: reordered.map((b) => b.id) }),
      });
      const data = await parseResponse(res);
      if (!res.ok) {
        throw new Error(extractError(data, 'Failed to reorder banners'));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to reorder banners');
      await fetchBanners();
    }
  };

  return (
    <div className="admin-theme min-h-screen bg-slate-50 text-slate-900">
      <nav className="bg-[#406093] border-b border-[#4c8ce4] px-6 py-4 flex items-center justify-between text-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <span className="text-[#91d06c]">/</span>
          <h1 className="font-semibold text-lg">Home Banner Slides</h1>
        </div>
        <button
          onClick={fetchBanners}
          className="text-[#91d06c] hover:text-[#E5E7EB]"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </nav>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {error && <div className="bg-red-50 border border-[#4c8ce4]/40 text-[#406093] p-4 rounded-xl">Error: {error}</div>}

        <section className="bg-white border rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">{editId ? 'Edit Slide' : 'Add Slide'}</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <input className="border rounded-lg px-3 py-2" placeholder="Title (optional)" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            <input className="border rounded-lg px-3 py-2" placeholder="Subtitle (optional)" value={form.subtitle} onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))} />
            <div className="md:col-span-2 border rounded-lg px-3 py-2">
              <div className="text-sm font-medium text-slate-700 mb-2">Banner Image{editId ? '' : 's'} {editId ? '(single)' : '(multiple allowed)'}</div>
              <input
                type="file"
                accept="image/*"
                multiple={!editId}
                onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                className="w-full text-sm"
              />
              {(imageFiles.length > 0 || existingImageUrl) && (
                <div className="mt-3 w-full max-w-[320px] h-[160px] rounded-md overflow-hidden border bg-slate-100">
                  <img
                    src={imageFiles[0] ? URL.createObjectURL(imageFiles[0]) : existingImageUrl}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {imageFiles.length > 1 && !editId && (
                <div className="mt-2 text-xs text-slate-600">{imageFiles.length} images selected. One slide will be created per image.</div>
              )}
            </div>
            <input className="border rounded-lg px-3 py-2" placeholder="Button text" value={form.cta_text} onChange={(e) => setForm((p) => ({ ...p, cta_text: e.target.value }))} />
            <input className="border rounded-lg px-3 py-2" placeholder="Button link" value={form.cta_link} onChange={(e) => setForm((p) => ({ ...p, cta_link: e.target.value }))} />
            <input className="border rounded-lg px-3 py-2" type="number" placeholder="Display order" value={form.display_order} onChange={(e) => setForm((p) => ({ ...p, display_order: Number(e.target.value || 0) }))} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
              Active slide
            </label>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#4c8ce4] hover:bg-[#406093] text-[#E5E7EB] px-4 py-2 rounded-lg"
            >
              <ImagePlus className="w-4 h-4" />
              {saving ? 'Saving...' : editId ? 'Update Slide' : 'Create Slide'}
            </button>
            {editId && (
              <button
                onClick={resetForm}
                className="px-4 py-2 rounded-lg border border-[#406093]/30 text-[#406093]"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </section>

        <section className="bg-white border rounded-2xl overflow-hidden">
          <div className="p-4 border-b bg-slate-50 font-medium">Current Slides</div>
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : orderedBanners.length === 0 ? (
            <div className="p-8 text-center text-slate-600">No slides yet.</div>
          ) : (
            <div className="divide-y">
              {orderedBanners.map((banner, index) => (
                <div key={banner.id} className="p-4 grid md:grid-cols-[120px_1fr_auto] gap-4 items-center">
                  <div className="w-[120px] h-[70px] rounded-md overflow-hidden border bg-slate-100">
                    <img src={banner.image_url} alt={banner.title || 'Slide'} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{banner.title || 'Untitled slide'}</div>
                    <div className="text-sm text-slate-600">{banner.subtitle || 'No subtitle'}</div>
                    <div className="text-xs text-slate-500 mt-1">{banner.cta_text || 'SHOP NOW'} {'->'} {banner.cta_link || '/shop'} | {banner.is_active ? 'Active' : 'Hidden'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleMove(banner.id, 'up')} disabled={index === 0} className="p-2 border rounded hover:bg-slate-50" title="Move up">
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleMove(banner.id, 'down')} disabled={index === orderedBanners.length - 1} className="p-2 border rounded hover:bg-slate-50" title="Move down">
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditId(banner.id);
                        setForm({
                          title: banner.title || '',
                          subtitle: banner.subtitle || '',
                          cta_text: banner.cta_text || 'SHOP NOW',
                          cta_link: banner.cta_link || '/shop',
                          is_active: banner.is_active,
                          display_order: banner.display_order || 0,
                        });
                        setExistingImageUrl(banner.image_url);
                        setImageFiles([]);
                      }}
                      className="p-2 border rounded hover:bg-slate-50 text-[#4c8ce4]"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(banner.id)} className="p-2 border rounded hover:bg-slate-50 text-red-600" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
