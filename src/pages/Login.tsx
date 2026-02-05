import { Brain, Mail, Lock, Eye, EyeOff, AlertCircle, Phone, User, ArrowLeft, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Schemas de validação
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const signupSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(10, 'Telefone inválido').max(15, 'Telefone inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'verify-email' | 'verify-phone';

export default function Login() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Signup fields
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Verification fields
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState<{ email?: boolean; phone?: boolean }>({});
  
  const { login, signup, isLoading, isAuthenticated, loginWithGoogle } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error("Google Login Error caught in component:", error);
      toast({
        title: "Erro no login",
        description: error.message || "Não foi possível iniciar sessão com Google.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'signup') {
      setMode('signup');
    }
  }, [searchParams]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setTelefone(formatted);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    try {
      loginSchema.parse({ email, password });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) errors[e.path[0] as string] = e.message;
        });
        setFieldErrors(errors);
        return;
      }
    }

    const success = await login(email, password);
    
    if (success) {
      toast({
        title: 'Bem-vindo!',
        description: 'Login realizado com sucesso.',
      });
      navigate('/dashboard');
    } else {
      setError('Email ou senha incorretos');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    try {
      signupSchema.parse({ nome, email, telefone, password, confirmPassword });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) errors[e.path[0] as string] = e.message;
        });
        setFieldErrors(errors);
        return;
      }
    }

    const { success, error: signupError } = await signup(email, password, nome, telefone);

    if (!success) {
      setError(signupError || 'Erro ao criar conta');
      return;
    }

    toast({
      title: 'Conta criada!',
      description: 'Verifique seu email para confirmar o cadastro.',
    });
    // In a real flow with email confirmation, we might stop here or show a "Check email" screen.
    // Since Supabase usually requires email confirmation by default, we tell them to check email.
    // If auto-confirm is on, they could login immediately, but let's assume standard flow.
    setMode('login');
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      setError('Digite o código de 6 dígitos');
      return;
    }

    // Simulação de verificação - em produção usar Supabase Auth
    toast({
      title: 'Email verificado!',
      description: 'Agora vamos verificar seu telefone.',
    });
    setVerificationCode('');
    setPendingVerification({ phone: true });
    setMode('verify-phone');
  };

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      setError('Digite o código de 6 dígitos');
      return;
    }

    // Simulação de verificação - em produção usar Supabase Auth
    toast({
      title: 'Cadastro concluído!',
      description: 'Sua conta foi criada com sucesso. Faça login para continuar.',
    });
    
    // Reset e volta para login
    setPendingVerification({});
    setVerificationCode('');
    setMode('login');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Digite seu email');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: 'Email enviado',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
      setMode('login');
    } catch (err) {
      console.error(err);
      setError('Erro ao enviar email de recuperação');
    }
  };

  const resendCode = () => {
    toast({
      title: 'Código reenviado',
      description: pendingVerification.email 
        ? 'Verifique seu email para o novo código.' 
        : 'Verifique seu SMS para o novo código.',
    });
  };

  const renderVerificationScreen = (type: 'email' | 'phone') => (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-display">
          Verificar {type === 'email' ? 'Email' : 'Telefone'}
        </CardTitle>
        <CardDescription>
          Digite o código de 6 dígitos enviado para {type === 'email' ? email : telefone}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={type === 'email' ? handleVerifyEmail : handleVerifyPhone} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="code">Código de verificação</Label>
            <Input
              id="code"
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-2xl tracking-widest"
              maxLength={6}
            />
          </div>

          <Button type="submit" className="w-full" size="lg">
            Verificar
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={resendCode}
              className="text-sm text-primary hover:underline"
            >
              Reenviar código
            </button>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setMode('signup');
              setPendingVerification({});
              setVerificationCode('');
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary mb-4">
            <Brain className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-white font-display">PRONTI</h1>
          <p className="text-sidebar-foreground/70 mt-1">Sistema de gestão para clínicas</p>
        </div>

        {/* Verification Screens */}
        {mode === 'verify-email' && renderVerificationScreen('email')}
        {mode === 'verify-phone' && renderVerificationScreen('phone')}

        {/* Login Card */}
        {mode === 'login' && (
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-display">Entrar</CardTitle>
              <CardDescription>
                Digite suas credenciais para acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      autoComplete="email"
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs text-destructive">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot-password')}
                      className="text-xs text-primary hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-destructive">{fieldErrors.password}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
                  </div>
                </div>

                <Button variant="outline" type="button" className="w-full h-12 text-base font-medium flex items-center justify-center gap-2" onClick={handleGoogleLogin}>
                   <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                  </svg>
                  Google
                </Button>

                <div className="text-center">
                  <span className="text-sm text-muted-foreground">Não tem conta? </span>
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Cadastre-se
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Signup Card */}
        {mode === 'signup' && (
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-display">Criar conta</CardTitle>
              <CardDescription>
                Preencha seus dados para começar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nome"
                      type="text"
                      placeholder="Seu nome completo"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="pl-10"
                      autoComplete="name"
                    />
                  </div>
                  {fieldErrors.nome && (
                    <p className="text-xs text-destructive">{fieldErrors.nome}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      autoComplete="email"
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs text-destructive">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone (WhatsApp)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={telefone}
                      onChange={handlePhoneChange}
                      className="pl-10"
                      autoComplete="tel"
                    />
                  </div>
                  {fieldErrors.telefone && (
                    <p className="text-xs text-destructive">{fieldErrors.telefone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-destructive">{fieldErrors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Criar conta
                </Button>

                <div className="text-center">
                  <span className="text-sm text-muted-foreground">Já tem conta? </span>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Faça login
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Forgot Password Card */}
        {mode === 'forgot-password' && (
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-display">Recuperar senha</CardTitle>
              <CardDescription>
                Digite seu email para receber instruções de recuperação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Enviar instruções
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setMode('login')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao login
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-sidebar-foreground/50 text-sm mt-6">
          © 2024 PRONTI. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
