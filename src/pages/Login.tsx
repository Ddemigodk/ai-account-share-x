import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("请输入用户名和密码");
      return;
    }

    try {
      await login({ username, password });
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "登录失败");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg mb-4">
            <LogIn className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            AI账号共享系统
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            团队AI工具账号统一管理
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">登录</CardTitle>
            <CardDescription>
              请输入您的账号密码
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  placeholder="请输入用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                <LogIn className="w-4 h-4 mr-2" />
                登录
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t text-sm text-slate-500">
              <p className="font-medium mb-1">默认账号：</p>
              <p>管理员: admin / admin123</p>
              <p>成员: member1~member5 / member123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
