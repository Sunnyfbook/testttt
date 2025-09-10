import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  username: string;
  email?: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin' as const,
    is_active: true
  });

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match AdminUser interface
      const adminUsers = (data || []).map(profile => ({
        id: profile.id,
        username: profile.username || profile.user_id,
        email: profile.username, // Using username field which stores email
        role: profile.role,
        is_active: true, // Profiles don't have is_active, so default to true
        created_at: profile.created_at,
        last_login: undefined
      }));
      
      setUsers(adminUsers);
    } catch (error) {
      console.error('Error loading admin users:', error);
      toast({
        title: "Error",
        description: "Failed to load admin users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'admin',
      is_active: true
    });
    setEditingUser(null);
  };

  const handleCreateUser = async () => {
    if (!formData.username || !formData.password) {
      toast({
        title: "Error",
        description: "Username and password are required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use Supabase auth to create user
      const { data, error } = await supabase.auth.signUp({
        email: formData.username, // Using username as email
        password: formData.password,
      });

      if (error) throw error;

      if (data.user) {
        // Update the profile role to admin after creation
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: formData.role })
          .eq('user_id', data.user.id);

        if (profileError) throw profileError;

        toast({
          title: "Success",
          description: "Admin user created successfully",
        });
        loadUsers();
        setShowDialog(false);
        resetForm();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create admin user",
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    // Since profiles don't have is_active, we'll just show a message
    toast({
      title: "Info", 
      description: "User status management not available with current auth system",
    });
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this admin user?')) return;

    try {
      // Delete the profile (this won't delete the auth user, just the profile)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admin user profile deleted successfully",
      });
      
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete admin user",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
            <div>
              <CardTitle>Admin Users</CardTitle>
              <p className="text-muted-foreground">Manage admin and moderator accounts</p>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="hero-button w-full sm:w-auto">
                  <UserPlus className="mr-2" size={16} />
                  <span className="hidden xs:inline">Add Admin User</span>
                  <span className="xs:hidden">Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Admin User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Email*</label>
                      <Input
                        type="email"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        placeholder="admin@example.com"
                      />
                    </div>

                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="admin@example.com"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Password*</label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Strong password"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <Select value={formData.role} onValueChange={(value: any) => setFormData({...formData, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">User will be created with Supabase Auth</span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setShowDialog(false)} className="w-full sm:w-auto">
                        Cancel
                      </Button>
                      <Button onClick={handleCreateUser} className="hero-button w-full sm:w-auto">
                        Create User
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg space-y-3 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3">
                    <h3 className="font-medium truncate">{user.username}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {user.role.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                        user.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2 space-y-1">
                    <p className="truncate">Email: {user.email || 'Not set'}</p>
                    <p>Created: {new Date(user.created_at).toLocaleDateString()}</p>
                    {user.last_login && (
                      <p>Last login: {new Date(user.last_login).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-end sm:justify-start">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No admin users found. Create the first admin user to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;