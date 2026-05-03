import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Users,
  KeyRound,
  BarChart3,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Unlock,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router";

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditMember, setShowEditMember] = useState<number | null>(null);
  const [showResetPassword, setShowResetPassword] = useState<number | null>(null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

  // 表单状态
  const [newMember, setNewMember] = useState({
    username: "", password: "", displayName: "", role: "member" as "admin" | "member", level: 1,
  });
  const [editMemberData, setEditMemberData] = useState({
    displayName: "", role: "member" as "admin" | "member", level: 1, isActive: true,
  });
  const [resetPasswordData, setResetPasswordData] = useState({ newPassword: "" });
  const [newAccount, setNewAccount] = useState({
    categoryId: 0, platform: "", accountName: "", loginAccount: "", loginPassword: "", apiKey: "", minLevelRequired: 1,
  });
  const [newCategory, setNewCategory] = useState({ name: "", icon: "", defaultMinLevel: 1 });

  const { data: dashboard } = trpc.admin.dashboard.useQuery(undefined, { enabled: isAdmin });
  const { data: members } = trpc.admin.listMembers.useQuery(undefined, { enabled: isAdmin });
  const { data: categories } = trpc.resource.listAllCategories.useQuery(undefined, { enabled: isAdmin });
  const { data: allAccounts } = trpc.resource.listAccounts.useQuery({}, { enabled: isAdmin });
  const { data: reservations } = trpc.admin.listReservations.useQuery({}, { enabled: isAdmin });
  const { data: stats } = trpc.admin.accountStats.useQuery(undefined, { enabled: isAdmin });

  const createMember = trpc.admin.createMember.useMutation({
    onSuccess: () => { utils.admin.listMembers.invalidate(); setShowAddMember(false); setNewMember({ username: "", password: "", displayName: "", role: "member", level: 1 }); },
  });
  const updateMember = trpc.admin.updateMember.useMutation({
    onSuccess: () => { utils.admin.listMembers.invalidate(); setShowEditMember(null); },
  });
  const resetPassword = trpc.admin.resetPassword.useMutation({
    onSuccess: () => { setShowResetPassword(null); setResetPasswordData({ newPassword: "" }); },
  });
  const createAccount = trpc.resource.createAccount.useMutation({
    onSuccess: () => { utils.resource.listAccounts.invalidate(); setShowAddAccount(false); setNewAccount({ categoryId: 0, platform: "", accountName: "", loginAccount: "", loginPassword: "", apiKey: "", minLevelRequired: 1 }); },
  });
  const createCategory = trpc.resource.createCategory.useMutation({
    onSuccess: () => { utils.resource.listAllCategories.invalidate(); setShowAddCategory(false); setNewCategory({ name: "", icon: "", defaultMinLevel: 1 }); },
  });
  const deleteAccount = trpc.resource.deleteAccount.useMutation({
    onSuccess: () => utils.resource.listAccounts.invalidate(),
  });
  const forceRelease = trpc.reservation.forceRelease.useMutation({
    onSuccess: () => { utils.resource.listAccounts.invalidate(); utils.reservation.todayReservations.invalidate(); },
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">无权访问</h2>
            <p className="text-slate-500 mb-4">需要管理员权限才能访问此页面</p>
            <Button onClick={() => navigate("/")}>返回首页</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* 顶部栏 */}
      <header className="bg-white dark:bg-slate-800 border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-bold text-lg">管理后台</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <UserPlus className="w-4 h-4" />
            <span>{user?.displayName}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="dashboard">
              <BarChart3 className="w-4 h-4 mr-1" />
              仪表盘
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="w-4 h-4 mr-1" />
              成员管理
            </TabsTrigger>
            <TabsTrigger value="resources">
              <KeyRound className="w-4 h-4 mr-1" />
              资源管理
            </TabsTrigger>
            <TabsTrigger value="reservations">
              <RefreshCw className="w-4 h-4 mr-1" />
              预约记录
            </TabsTrigger>
          </TabsList>

          {/* 仪表盘 */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-500">总成员</p>
                  <p className="text-3xl font-bold">{dashboard?.totalMembers || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-500">总账号</p>
                  <p className="text-3xl font-bold">{dashboard?.totalAccounts || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-500">占用中</p>
                  <p className="text-3xl font-bold text-amber-600">{dashboard?.occupiedAccounts || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-500">今日预约</p>
                  <p className="text-3xl font-bold text-green-600">{dashboard?.todayReservations || 0}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>账号利用率</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>类型</TableHead>
                      <TableHead>总数</TableHead>
                      <TableHead>占用中</TableHead>
                      <TableHead>利用率</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(stats || []).map((stat) => (
                      <TableRow key={stat.categoryId}>
                        <TableCell className="font-medium">{stat.categoryName}</TableCell>
                        <TableCell>{stat.total}</TableCell>
                        <TableCell>{stat.occupied}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${stat.total > 0 ? (stat.occupied / stat.total) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-sm">
                              {stat.total > 0 ? Math.round((stat.occupied / stat.total) * 100) : 0}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 成员管理 */}
          <TabsContent value="members" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">成员列表</h2>
              <Button onClick={() => setShowAddMember(true)}>
                <Plus className="w-4 h-4 mr-1" />
                添加成员
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>用户名</TableHead>
                      <TableHead>昵称</TableHead>
                      <TableHead>角色</TableHead>
                      <TableHead>等级</TableHead>
                      <TableHead>占用数</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(members || []).map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.username}</TableCell>
                        <TableCell>{member.displayName}</TableCell>
                        <TableCell>
                          <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                            {member.role === "admin" ? "管理员" : "成员"}
                          </Badge>
                        </TableCell>
                        <TableCell>Lv.{member.level}</TableCell>
                        <TableCell>{member.activeReservations}</TableCell>
                        <TableCell>
                          <Badge variant={member.isActive ? "default" : "destructive"}>
                            {member.isActive ? "正常" : "禁用"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setShowEditMember(member.id);
                                setEditMemberData({
                                  displayName: member.displayName,
                                  role: member.role,
                                  level: member.level,
                                  isActive: member.isActive,
                                });
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setShowResetPassword(member.id)}
                            >
                              <KeyRound className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 资源管理 */}
          <TabsContent value="resources" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">工具类型</h2>
              <Button onClick={() => setShowAddCategory(true)}>
                <Plus className="w-4 h-4 mr-1" />
                添加类型
              </Button>
            </div>

            {(categories || []).map((category) => (
              <Card key={category.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {category.name}
                      <span className="text-sm font-normal text-slate-500 ml-2">
                        (需Lv.{category.defaultMinLevel})
                      </span>
                    </CardTitle>
                    <Badge variant={category.isActive ? "default" : "secondary"}>
                      {category.isActive ? "启用" : "禁用"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium">账号列表</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNewAccount({ ...newAccount, categoryId: category.id });
                        setShowAddAccount(true);
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      添加账号
                    </Button>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>平台</TableHead>
                        <TableHead>账号名</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>等级要求</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(allAccounts || [])
                        .filter((a) => a.categoryId === category.id)
                        .map((account) => (
                          <TableRow key={account.id}>
                            <TableCell>{account.platform}</TableCell>
                            <TableCell>{account.accountName}</TableCell>
                            <TableCell>
                              <Badge variant={account.status === "occupied" ? "destructive" : "default"}>
                                {account.status === "occupied" ? "被使用" : "待使用"}
                              </Badge>
                            </TableCell>
                            <TableCell>Lv.{account.minLevelRequired}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {account.status === "occupied" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => forceRelease.mutate({ accountId: account.id })}
                                  >
                                    <Unlock className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm("确定删除此账号？")) {
                                      deleteAccount.mutate({ id: account.id });
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* 预约记录 */}
          <TabsContent value="reservations">
            <Card>
              <CardHeader>
                <CardTitle>预约记录</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>成员</TableHead>
                      <TableHead>账号</TableHead>
                      <TableHead>时段</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>到期时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reservations || []).map((res) => (
                      <TableRow key={res.id}>
                        <TableCell>{res.id}</TableCell>
                        <TableCell>{res.displayName}</TableCell>
                        <TableCell>{res.platform} - {res.accountName}</TableCell>
                        <TableCell>
                          {res.timeSlot === "slot_1" && "09:00-14:00"}
                          {res.timeSlot === "slot_2" && "14:00-18:00"}
                          {res.timeSlot === "slot_3" && "18:00-24:00"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              res.status === "active"
                                ? "default"
                                : res.status === "expired"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {res.status === "active" ? "进行中" : res.status === "expired" ? "已过期" : "已取消"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(res.expiresAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* 添加成员弹窗 */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加成员</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>用户名</Label>
              <Input value={newMember.username} onChange={(e) => setNewMember({ ...newMember, username: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>密码</Label>
              <Input type="password" value={newMember.password} onChange={(e) => setNewMember({ ...newMember, password: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>昵称</Label>
              <Input value={newMember.displayName} onChange={(e) => setNewMember({ ...newMember, displayName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={newMember.role}
                onChange={(e) => setNewMember({ ...newMember, role: e.target.value as "admin" | "member" })}
              >
                <option value="member">成员</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>等级 (1-5)</Label>
              <Input type="number" min={1} max={5} value={newMember.level} onChange={(e) => setNewMember({ ...newMember, level: parseInt(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMember(false)}>取消</Button>
            <Button onClick={() => createMember.mutate(newMember)}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑成员弹窗 */}
      <Dialog open={!!showEditMember} onOpenChange={() => setShowEditMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑成员</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>昵称</Label>
              <Input value={editMemberData.displayName} onChange={(e) => setEditMemberData({ ...editMemberData, displayName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={editMemberData.role}
                onChange={(e) => setEditMemberData({ ...editMemberData, role: e.target.value as "admin" | "member" })}
              >
                <option value="member">成员</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>等级 (1-5)</Label>
              <Input type="number" min={1} max={5} value={editMemberData.level} onChange={(e) => setEditMemberData({ ...editMemberData, level: parseInt(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={editMemberData.isActive ? "true" : "false"}
                onChange={(e) => setEditMemberData({ ...editMemberData, isActive: e.target.value === "true" })}
              >
                <option value="true">正常</option>
                <option value="false">禁用</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditMember(null)}>取消</Button>
            <Button onClick={() => showEditMember && updateMember.mutate({ id: showEditMember, ...editMemberData })}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重置密码弹窗 */}
      <Dialog open={!!showResetPassword} onOpenChange={() => setShowResetPassword(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>新密码</Label>
              <Input type="password" value={resetPasswordData.newPassword} onChange={(e) => setResetPasswordData({ newPassword: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPassword(null)}>取消</Button>
            <Button onClick={() => showResetPassword && resetPassword.mutate({ id: showResetPassword, ...resetPasswordData })}>重置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加账号弹窗 */}
      <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>添加账号</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>平台名称</Label>
              <Input value={newAccount.platform} onChange={(e) => setNewAccount({ ...newAccount, platform: e.target.value })} placeholder="如：ChatGPT" />
            </div>
            <div className="space-y-2">
              <Label>账号名称</Label>
              <Input value={newAccount.accountName} onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })} placeholder="如：GPT-Team-01" />
            </div>
            <div className="space-y-2">
              <Label>登录账号</Label>
              <Input value={newAccount.loginAccount} onChange={(e) => setNewAccount({ ...newAccount, loginAccount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>登录密码</Label>
              <Input value={newAccount.loginPassword} onChange={(e) => setNewAccount({ ...newAccount, loginPassword: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>API Key (可选)</Label>
              <Input value={newAccount.apiKey} onChange={(e) => setNewAccount({ ...newAccount, apiKey: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>最低使用等级</Label>
              <Input type="number" min={1} max={5} value={newAccount.minLevelRequired} onChange={(e) => setNewAccount({ ...newAccount, minLevelRequired: parseInt(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAccount(false)}>取消</Button>
            <Button onClick={() => createAccount.mutate(newAccount)}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加类型弹窗 */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加工具类型</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>类型名称</Label>
              <Input value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="如：AI对话" />
            </div>
            <div className="space-y-2">
              <Label>图标名称</Label>
              <Input value={newCategory.icon} onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })} placeholder="如：MessageSquare" />
            </div>
            <div className="space-y-2">
              <Label>默认最低等级</Label>
              <Input type="number" min={1} max={5} value={newCategory.defaultMinLevel} onChange={(e) => setNewCategory({ ...newCategory, defaultMinLevel: parseInt(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategory(false)}>取消</Button>
            <Button onClick={() => createCategory.mutate(newCategory)}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
