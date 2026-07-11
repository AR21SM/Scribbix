import { Button } from "@repo/ui/button";
import { Pencil, Share2, Users2, Sparkles, Zap, Shield } from "lucide-react";
import Link from "next/link";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6">
              <span className="inline-block px-4 py-1 text-sm font-semibold text-blue-400 bg-blue-900/30 rounded-full border border-blue-500/30">
                ✨ Real-time Collaboration
              </span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl text-white mb-6">
              Collaborative Whiteboarding
              <span className="block bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-300 leading-relaxed">
              Create, collaborate, and share beautiful diagrams and sketches with our intuitive drawing tool. 
              Perfect for teams, students, and creative minds.
            </p>
            <div className="mt-12 flex items-center justify-center gap-x-6 flex-wrap">
              <Link href={"/signup"}>
                <Button variant={"primary"} size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700">
                  Get Started Free
                  <Pencil className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/signin">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg border-gray-600 text-white hover:bg-gray-800">
                  Sign In
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              No credit card required • Free forever
            </p>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-gray-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">
              Everything you need to collaborate
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful features designed for seamless team collaboration and creative expression
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-8 bg-gray-800 border-2 border-gray-700 hover:border-blue-500 transition-all duration-300 hover:transform hover:scale-105 rounded-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <Share2 className="h-7 w-7 text-blue-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white">Real-time Collaboration</h3>
              </div>
              <p className="mt-4 text-gray-400 leading-relaxed">
                Work together with your team in real-time. See changes instantly as they happen with WebSocket technology.
              </p>
            </div>

            <div className="p-8 bg-gray-800 border-2 border-gray-700 hover:border-purple-500 transition-all duration-300 hover:transform hover:scale-105 rounded-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
                  <Users2 className="h-7 w-7 text-purple-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white">Multiplayer Editing</h3>
              </div>
              <p className="mt-4 text-gray-400 leading-relaxed">
                Multiple users can edit the same canvas simultaneously. Perfect for brainstorming sessions.
              </p>
            </div>

            <div className="p-8 bg-gray-800 border-2 border-gray-700 hover:border-green-500 transition-all duration-300 hover:transform hover:scale-105 rounded-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                  <Pencil className="h-7 w-7 text-green-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white">Rich Drawing Tools</h3>
              </div>
              <p className="mt-4 text-gray-400 leading-relaxed">
                Pencil, shapes, arrows, colors, and more. Everything you need to express your ideas visually.
              </p>
            </div>

            <div className="p-8 bg-gray-800 border-2 border-gray-700 hover:border-yellow-500 transition-all duration-300 hover:transform hover:scale-105 rounded-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <Zap className="h-7 w-7 text-yellow-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white">Lightning Fast</h3>
              </div>
              <p className="mt-4 text-gray-400 leading-relaxed">
                Built with performance in mind. Smooth drawing experience even with hundreds of shapes.
              </p>
            </div>

            <div className="p-8 bg-gray-800 border-2 border-gray-700 hover:border-red-500 transition-all duration-300 hover:transform hover:scale-105 rounded-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <Shield className="h-7 w-7 text-red-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white">Secure & Private</h3>
              </div>
              <p className="mt-4 text-gray-400 leading-relaxed">
                Your data is encrypted and secure. Enterprise-grade security with bcrypt and JWT.
              </p>
            </div>

            <div className="p-8 bg-gray-800 border-2 border-gray-700 hover:border-pink-500 transition-all duration-300 hover:transform hover:scale-105 rounded-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30">
                  <Sparkles className="h-7 w-7 text-pink-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white">Export & Share</h3>
              </div>
              <p className="mt-4 text-gray-400 leading-relaxed">
                Download your creations as PNG. Share your canvas with anyone via simple links.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 sm:p-20 shadow-2xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6">
                Ready to start creating?
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-xl text-white/90 leading-relaxed">
                Join thousands of users who are already creating amazing diagrams and sketches. 
                Start your first canvas in seconds.
              </p>
              <div className="mt-12 flex items-center justify-center gap-x-6">
                <Link href="/signup">
                  <Button size="lg" variant="secondary" className="h-14 px-8 text-lg bg-white text-blue-600 hover:bg-gray-100">
                    Create Free Account
                    <Pencil className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Scribbix</h3>
            <p className="text-gray-400 mb-4">Collaborative whiteboarding made simple</p>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Scribbix. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;