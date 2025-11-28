import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import API, { type User } from '@/api/api';
import { User as UserIcon, Edit, Save, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for editing
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
  });

  // Fetch user profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await API.users.getMyProfile();
      setUser(userData);

      setFormData({
        name: userData.name,
        email: userData.email || '',
        username: userData.username || '',
        password: '',
      });
    } catch (err: unknown) {
      console.error('Failed to fetch profile:', err);
      const errorMessage = (err as { response?: { data?: { message?: string }; status?: number } })?.response?.data?.message || 'Failed to load profile. Please try again.';
      setError(errorMessage);
      // If unauthorized, redirect to login
      if ((err as { response?: { status?: number } })?.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form data
      
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        username: user?.username || '',
        password: '',
      });
      setIsEditing(false);
      setError(null);
      setSuccess(null);
    } else {
      // Start editing
      setIsEditing(true);
      setError(null);
      setSuccess(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Prepare update data 
      const updateData: Record<string, string> = {};

      
      if (formData.name !== user?.email) {
        updateData.name = formData.name;
      }
      if (formData.email !== user?.email) updateData.email = formData.email;
      if (formData.password) updateData.password = formData.password;

      // Call API to update profile
      const updatedUser = await API.users.updateMyProfile(updateData);
      setUser(updatedUser);
      
      setFormData({
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        username: updatedUser.username || '',
        password: '',
      });
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: unknown) {
      console.error('Failed to update profile:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update profile. Please try again.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">My Profile</h1>
                  <p className="text-muted-foreground">Manage your account information</p>
                </div>
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button onClick={handleEditToggle} className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleEditToggle}
                      disabled={saving}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Error/Success Messages */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive"
              >
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 dark:text-green-400"
              >
                <p className="text-sm font-medium">{success}</p>
              </motion.div>
            )}

            {/* Profile Form */}
            <div className="space-y-6">
              {/* Username and Role */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={user?.role || ''}
                    disabled
                    className="bg-muted capitalize"
                  />
                  <p className="text-xs text-muted-foreground">Role is assigned by system</p>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter your full name"
                  className={!isEditing ? 'bg-muted' : ''}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                  className={!isEditing ? 'bg-muted' : ''}
                />
              </div>

              {/* Password (only shown when editing) */}
              {isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Leave blank to keep current password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank to keep current password
                  </p>
                </div>
              )}

              {/* Account Info Section */}
              <div className="pt-4">
                <Separator className="mb-4" />
                <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              </div>

              {/* Account Created and Last Updated */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="createdAt">Account Created</Label>
                  <Input
                    id="createdAt"
                    value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="updatedAt">Last Updated</Label>
                  <Input
                    id="updatedAt"
                    value={user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* User ID */}
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  value={user?.id || ''}
                  disabled
                  className="bg-muted font-mono text-sm"
                />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}
