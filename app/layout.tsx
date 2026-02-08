import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { TabBar } from "@/features/navigation/components/tab-bar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "tile-chatter",
  description: "Hyperlocal verified-human chat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  var t=function(){return new Date().toISOString().slice(11,23)};
  console.log('[boot]['+t()+'] page loading, readyState='+document.readyState);
  console.log('[boot]['+t()+'] href='+location.href);
  console.log('[boot]['+t()+'] userAgent='+navigator.userAgent);
  console.log('[boot]['+t()+'] __ALIEN_AUTH_TOKEN__='+(typeof window.__ALIEN_AUTH_TOKEN__==='string'?'present('+window.__ALIEN_AUTH_TOKEN__.slice(0,20)+'...)':''+window.__ALIEN_AUTH_TOKEN__));
  console.log('[boot]['+t()+'] __miniAppsBridge__='+(window.__miniAppsBridge__?'present':'undefined'));
  console.log('[boot]['+t()+'] __ALIEN_PLATFORM__='+window.__ALIEN_PLATFORM__);
  console.log('[boot]['+t()+'] __ALIEN_CONTRACT_VERSION__='+window.__ALIEN_CONTRACT_VERSION__);
  window.__tileChatLogs=[];
  window.__tileChatLog=function(msg){
    var e={time:t(),msg:msg};
    window.__tileChatLogs.push(e);
    console.log('[tc]['+e.time+'] '+msg);
  };
  window.addEventListener('error',function(ev){
    window.__tileChatLog('UNCAUGHT ERROR: '+ev.message+' at '+ev.filename+':'+ev.lineno);
  });
  window.addEventListener('unhandledrejection',function(ev){
    window.__tileChatLog('UNHANDLED REJECTION: '+(ev.reason&&ev.reason.message||ev.reason));
  });
  window.addEventListener('message',function(ev){
    var d=ev.data;
    if(typeof d==='string'){try{d=JSON.parse(d)}catch(e){return}}
    if(d&&typeof d==='object'&&d.type&&d.name){
      window.__tileChatLog('BRIDGE MSG: type='+d.type+' name='+d.name+' payload='+JSON.stringify(d.payload).slice(0,200));
    }
  });
  window.__tileChatLog('boot script done');
  // Flush logs to server every 3s so we can read them even if UI never renders
  setInterval(function(){
    if(window.__tileChatLogs&&window.__tileChatLogs.length>0){
      var payload=window.__tileChatLogs.slice();
      fetch('/api/debug-log',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({logs:payload})}).catch(function(){});
    }
  },3000);
})();
`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-3 px-4 pb-24 pt-4">
            {children}
          </main>
          <TabBar />
        </Providers>
      </body>
    </html>
  );
}
