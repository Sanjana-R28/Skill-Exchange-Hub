import { useAuth } from "@/hooks/use-auth";
import { Redirect, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { GraduationCap, Sparkles, Users, BookOpen } from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <GraduationCap className="h-16 w-16 text-primary animate-pulse mb-4" />
        <p className="text-muted-foreground font-medium">Loading your campus commons...</p>
      </div>
    );
  }

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="px-6 lg:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3 text-primary">
          <GraduationCap className="h-8 w-8" />
          <span className="font-bold text-2xl tracking-tight">SkillX</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
            Sign In
          </Link>
          <Link href="/login" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            <span>The campus skill exchange is live</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
            Trade what you <span className="text-primary">know</span>.<br />
            Learn what you <span className="text-chart-2">want</span>.
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl">
            Join your college's peer-learning network. Teach someone React, learn how to play guitar in return. Building connections through shared knowledge.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full shadow-lg shadow-primary/20">
                Join Your Campus
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 rounded-full">
                See How It Works
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-24 bg-muted/50 border-t">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <BookOpen className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">List Your Skills</h3>
                <p className="text-muted-foreground">Add what you're good at and what you want to learn. Our algorithm finds the perfect matches.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-chart-2/10 flex items-center justify-center text-chart-2 mb-2">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Get Matched</h3>
                <p className="text-muted-foreground">Discover classmates who need your expertise and can teach you exactly what you're looking for.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-chart-4/10 flex items-center justify-center text-chart-4 mb-2">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Connect & Learn</h3>
                <p className="text-muted-foreground">Message your matches, set up study sessions, and start exchanging knowledge on campus.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t">
        <p>© {new Date().getFullYear()} Student Skill Exchange. Built for campus communities.</p>
      </footer>
    </div>
  );
}