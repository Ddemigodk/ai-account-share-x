import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  LogOut,
  User,
  Shield,
  Lock,
  Unlock,
  Eye,
  Copy,
  CheckCircle,
  MessageSquare,
  PenTool,
  Palette,
  Code2,
  Video,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router";

const SLOT_LABELS = {
  slot_1: "09:00 - 14:00",
  slot_2: "14:00 - 18:00",
  slot_3: "18:00 - 24:00",
};

const ICON_MAP: Record<string, React.ReactNode> = {
  MessageSquare: <MessageSquare className="w-4 h-4" />,
  PenTool: <PenTool className="w-4 h-4" />,
  Palette: <Palette className="w-4 h-4" />,
  Code2: <Code2 className="w-4 h-4" />,
  Video: <Video className="w-4 h-4" />,
};

export default function Dashboard() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [selectedSlot, setSelectedSlot] = useState<"slot_1" | "slot_2" | "slot_3">("slot_1");
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [detailAccount, setDetailAccount] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const { data: categories } = trpc.resource.listCategories.useQuery();
  const { data: accountList } = trpc.resource.listAccounts.useQuery(
    { timeSlot: selectedSlot },
    { refetchInterval: 10000 }
  );
  const { data: myReservations } = trpc.reservation.myReservations.useQuery(
    undefined,
    { refetchInterval: 10000 }
  );
  const { data: accountDetail } = trpc.resource.getAccountDetail.useQuery(
    { id: detailAccount! },
    { enabled: !!detailAccount }
  );

  const occupyMutation = trpc.reservation.create.useMutation({
    onSuccess: () => {
      utils.resource.listAccounts.invalidate();
      utils.reservation.myReservations.invalidate();
    },
  });

  const cancelMutation = trpc.reservation.cancel.useMutation({
    onSuccess: () => {
      utils.resource.listAccounts.invalidate();
      utils.reservation.myReservations.invalidate();
    },
  });

  const toggleCategory = (id: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleOccupy = async (accountId: number) => {
    const today = new Date().toISOString().split("T")[0];
    try {
      await occupyMutation.mutateAsync({
        accountId,
        timeSlot: selectedSlot,
        date: today,
      });
    } catch (err: any) {
      alert(err.message || "占用失败");
    }
  };

  const handleCancel = async (reservationId: number) => {
    try {
      await cancelMutation.mutateAsync({ id: reservationId });
    } catch (err: any) {
      alert(err.message || "取消失败");
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // 按类型分组账号
  const groupedAccounts = (accountList || []).reduce<Record<number, typeof accountList>>(
    (acc, account) => {
      if (!acc[account.categoryId]) {
        acc[account.categoryId] = [];
      }
      acc[account.categoryId]!.push(account);
      return acc;
    },
    {}
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* 顶部栏 */}
      <header className="bg-white dark:bg-slate-800 border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-bold text-lg">AI账号共享系统</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <User className="w-4 h-4" />
              <span>{user.displayName}</span>
              <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-xs">
                Lv.{user.level}
              </Badge>
            </div>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
                <Shield className="w-4 h-4 mr-1" />
                管理后台
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-1" />
              退出
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* 时段选择器 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              选择时段
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedSlot} onValueChange={(v) => setSelectedSlot(v as typeof selectedSlot)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="slot_1">{SLOT_LABELS.slot_1}</TabsTrigger>
                <TabsTrigger value="slot_2">{SLOT_LABELS.slot_2}</TabsTrigger>
                <TabsTrigger value="slot_3">{SLOT_LABELS.slot_3}</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* 我的当前占用 */}
        {myReservations && myReservations.length > 0 && myReservations[0] && (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <CheckCircle className="w-4 h-4" />
                我的当前占用
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {myReservations.map((res) => (
                <div
                  key={res.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <div>
                      <p className="font-medium">
                        {res.platform} - {res.accountName}
                      </p>
                      <p className="text-sm text-slate-500">
                        {SLOT_LABELS[res.timeSlot as keyof typeof SLOT_LABELS]} | 到期：{new Date(res.expiresAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDetailAccount(res.accountId)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      查看
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancel(res.id)}
                    >
                      <Unlock className="w-4 h-4 mr-1" />
                      提前释放
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* AI工具类型列表 */}
        <div className="space-y-4">
          {(categories || []).map((category) => {
            const categoryAccounts = groupedAccounts[category.id] || [];
            const isExpanded = expandedCategories.has(category.id);

            return (
              <Card key={category.id}>
                <CardHeader
                  className="pb-3 cursor-pointer"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {ICON_MAP[category.icon || ""] || <MessageSquare className="w-4 h-4" />}
                      {category.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">
                        {categoryAccounts.filter((a) => a.status === "available").length} / {categoryAccounts.length} 可用
                      </span>
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {categoryAccounts.length === 0 ? (
                        <p className="text-sm text-slate-500 py-4 text-center">暂无账号</p>
                      ) : (
                        categoryAccounts.map((account) => (
                          <div
                            key={account.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {account.status === "occupied" ? (
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                              )}
                              <div>
                                <p className="font-medium">
                                  {account.platform} - {account.accountName}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {account.status === "occupied" ? (
                                    <Badge variant="destructive" className="text-xs">被使用</Badge>
                                  ) : (
                                    <Badge variant="default" className="text-xs bg-green-600">待使用</Badge>
                                  )}
                                  {account.minLevelRequired > 1 && (
                                    <span className="text-xs text-slate-500">
                                      需Lv.{account.minLevelRequired}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {account.status === "occupied" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDetailAccount(account.id)}
                                  disabled={account.currentUserId !== user.id && user.role !== "admin"}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  查看
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleOccupy(account.id)}
                                  disabled={occupyMutation.isPending}
                                >
                                  <Lock className="w-4 h-4 mr-1" />
                                  占用
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </main>

      {/* 账号详情弹窗 */}
      <Dialog open={!!detailAccount} onOpenChange={() => setDetailAccount(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              账号登录信息
            </DialogTitle>
          </DialogHeader>

          {accountDetail && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4" />
                  <p className="text-sm font-medium">请勿将账号信息泄露给团队外人员</p>
                </div>
              </div>

              {accountDetail.loginAccount && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">登录账号</label>
                  <div className="flex gap-2">
                    <code className="flex-1 p-2 bg-slate-100 dark:bg-slate-800 rounded text-sm break-all">
                      {accountDetail.loginAccount}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(accountDetail.loginAccount!, "account")}
                    >
                      {copiedField === "account" ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {accountDetail.loginPassword && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">登录密码</label>
                  <div className="flex gap-2">
                    <code className="flex-1 p-2 bg-slate-100 dark:bg-slate-800 rounded text-sm break-all">
                      {accountDetail.loginPassword}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(accountDetail.loginPassword!, "password")}
                    >
                      {copiedField === "password" ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {accountDetail.apiKey && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key</label>
                  <div className="flex gap-2">
                    <code className="flex-1 p-2 bg-slate-100 dark:bg-slate-800 rounded text-sm break-all">
                      {accountDetail.apiKey}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(accountDetail.apiKey!, "apikey")}
                    >
                      {copiedField === "apikey" ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
