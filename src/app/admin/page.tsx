'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Lock, Plus, Trash2, BarChart3 } from 'lucide-react';
import { db, type AdConfig } from '@/lib/db';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [ads, setAds] = useState<AdConfig[]>([]);

  // New ad form
  const [newAd, setNewAd] = useState({
    zone: 'sidebar' as AdConfig['zone'],
    advertiserName: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    isPremium: false,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const loadAds = useCallback(async () => {
    const allAds = await db.adConfigs.toArray();
    setAds(allAds);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAds();
    }
  }, [isAuthenticated, loadAds]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password check — in production, use env variable
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    if (password === adminPassword) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Parolă incorectă');
    }
  };

  const handleAddAd = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.adConfigs.add({
      ...newAd,
      isActive: true,
      clicks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setNewAd({
      zone: 'sidebar',
      advertiserName: '',
      description: '',
      imageUrl: '',
      linkUrl: '',
      isPremium: false,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    loadAds();
  };

  const handleToggleAd = async (id: number, isActive: boolean) => {
    await db.adConfigs.update(id, { isActive: !isActive, updatedAt: new Date().toISOString() });
    loadAds();
  };

  const handleDeleteAd = async (id: number) => {
    if (confirm('Ștergi această reclamă?')) {
      await db.adConfigs.delete(id);
      loadAds();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
              <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <CardTitle>Admin Panel</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="password">Parolă</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Introdu parola admin"
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full">Autentificare</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Administrare Reclame</h1>

        {/* Add new ad */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              <Plus className="h-4 w-4 inline mr-1" />
              Adaugă Reclamă Nouă
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddAd} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Numele Advertiserului</Label>
                  <Input
                    value={newAd.advertiserName}
                    onChange={e => setNewAd({ ...newAd, advertiserName: e.target.value })}
                    placeholder="ex. Trading212"
                    required
                  />
                </div>
                <div>
                  <Label>Zona</Label>
                  <Select
                    value={newAd.zone}
                    onValueChange={(v) => setNewAd({ ...newAd, zone: v as AdConfig['zone'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sidebar">Sidebar</SelectItem>
                      <SelectItem value="carousel">Carousel</SelectItem>
                      <SelectItem value="popup">Popup Premium</SelectItem>
                      <SelectItem value="recommendations-page">Pagina Recomandări</SelectItem>
                      <SelectItem value="contextual">Contextual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>URL Imagine</Label>
                  <Input
                    value={newAd.imageUrl}
                    onChange={e => setNewAd({ ...newAd, imageUrl: e.target.value })}
                    placeholder="/ads/logo.png"
                  />
                </div>
                <div>
                  <Label>Link URL</Label>
                  <Input
                    value={newAd.linkUrl}
                    onChange={e => setNewAd({ ...newAd, linkUrl: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Data Început</Label>
                  <Input
                    type="date"
                    value={newAd.startDate}
                    onChange={e => setNewAd({ ...newAd, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Data Sfârșit</Label>
                  <Input
                    type="date"
                    value={newAd.endDate}
                    onChange={e => setNewAd({ ...newAd, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Descriere</Label>
                <Textarea
                  value={newAd.description}
                  onChange={e => setNewAd({ ...newAd, description: e.target.value })}
                  placeholder="Descriere scurtă a partenerului..."
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPremium"
                  checked={newAd.isPremium}
                  onChange={e => setNewAd({ ...newAd, isPremium: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isPremium" className="text-sm cursor-pointer">
                  Premium (poziție fixă în carousel + popup)
                </Label>
              </div>

              <Button type="submit">
                <Plus className="h-4 w-4 mr-1" />
                Adaugă Reclamă
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing ads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              <BarChart3 className="h-4 w-4 inline mr-1" />
              Reclame Active ({ads.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ads.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nu există reclame configurate.</p>
            ) : (
              <div className="space-y-3">
                {ads.map(ad => (
                  <div key={ad.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{ad.advertiserName}</p>
                        <Badge variant={ad.isActive ? 'default' : 'secondary'}>
                          {ad.isActive ? 'Activ' : 'Inactiv'}
                        </Badge>
                        {ad.isPremium && (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                            Premium
                          </Badge>
                        )}
                        <Badge variant="outline">{ad.zone}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ad.startDate} → {ad.endDate} | {ad.clicks} click-uri
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => ad.id && handleToggleAd(ad.id, ad.isActive)}
                      >
                        {ad.isActive ? 'Dezactivează' : 'Activează'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => ad.id && handleDeleteAd(ad.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
