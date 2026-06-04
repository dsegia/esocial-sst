import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'

// ─── CSS ────────────────────────────────────────────────────────────────────
const globalCSS = `
*{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#0f172a;overflow-x:hidden;}

@keyframes float{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-18px) rotate(2deg)}}
@keyframes float2{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-12px) rotate(-2deg)}}
@keyframes blob{0%,100%{border-radius:42% 58% 70% 30%/45% 45% 55% 55%}25%{border-radius:70% 30% 46% 54%/30% 60% 40% 70%}50%{border-radius:30% 70% 70% 30%/30% 30% 70% 70%}75%{border-radius:58% 42% 34% 66%/63% 37% 63% 37%}}
@keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.8)}}
@keyframes fade-up{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes slide-right{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}}
@keyframes slide-left{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
@keyframes spin-slow{to{transform:rotate(360deg)}}
@keyframes count-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
@keyframes glow-pulse{0%,100%{box-shadow:0 0 0 0 rgba(24,95,165,.4)}50%{box-shadow:0 0 0 12px rgba(24,95,165,0)}}

/* ── NAV ── */
nav{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(226,232,240,.8);transition:box-shadow .2s;}
nav.scrolled{box-shadow:0 4px 24px rgba(15,23,42,.08);}
.nav-inner{max-width:1180px;margin:0 auto;padding:0 24px;height:80px;display:flex;align-items:center;justify-content:space-between;}
.nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
.nav-logo-mark{width:36px;height:36px;background:linear-gradient(135deg,#185FA5,#3b82f6);border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(24,95,165,.3);}
.nav-logo-text{font-size:15px;font-weight:800;color:#0f172a;letter-spacing:-.3px;}
.nav-logo-text span{color:#185FA5;}
.nav-links{display:flex;align-items:center;gap:6px;}
.nav-links a{font-size:13px;color:#475569;text-decoration:none;font-weight:500;padding:7px 12px;border-radius:8px;transition:background .15s,color .15s;}
.nav-links a:hover{background:#f1f5f9;color:#0f172a;}
.nav-cta{display:flex;gap:8px;align-items:center;}
.btn-ghost{padding:8px 16px;border:1.5px solid #e2e8f0;border-radius:9px;font-size:13px;font-weight:600;color:#475569;background:transparent;cursor:pointer;text-decoration:none;transition:border-color .15s,color .15s,background .15s;}
.btn-ghost:hover{border-color:#185FA5;color:#185FA5;background:rgba(24,95,165,.04);}
.btn-primary{padding:9px 20px;border:none;border-radius:9px;font-size:13px;font-weight:700;color:#fff;background:linear-gradient(135deg,#185FA5,#3b82f6);cursor:pointer;text-decoration:none;box-shadow:0 4px 14px rgba(59,130,246,.3);transition:box-shadow .2s,transform .1s;}
.btn-primary:hover{box-shadow:0 6px 22px rgba(59,130,246,.45);transform:translateY(-1px);}
.nav-mobile-btn{display:none;background:none;border:none;cursor:pointer;padding:6px;}

/* ── HERO ── */
.hero{min-height:100vh;display:flex;align-items:center;padding:100px 24px 80px;background:#f8fafc;position:relative;overflow:hidden;}
.hero-blob1{position:absolute;width:520px;height:520px;background:radial-gradient(circle,rgba(24,95,165,.14) 0%,transparent 70%);top:-120px;right:-100px;animation:blob 12s ease-in-out infinite;pointer-events:none;}
.hero-blob2{position:absolute;width:400px;height:400px;background:radial-gradient(circle,rgba(59,130,246,.1) 0%,transparent 70%);bottom:-80px;left:-80px;animation:blob 15s ease-in-out infinite reverse;pointer-events:none;}
.hero-blob3{position:absolute;width:280px;height:280px;background:radial-gradient(circle,rgba(99,102,241,.08) 0%,transparent 70%);top:40%;left:40%;animation:blob 18s ease-in-out infinite .5s;pointer-events:none;}
.hero-dots{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(24,95,165,.08) 1px,transparent 1px);background-size:32px 32px;pointer-events:none;opacity:.6;}
.hero-inner{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center;position:relative;z-index:1;}
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:#fff;color:#185FA5;border:1.5px solid rgba(24,95,165,.2);border-radius:99px;padding:6px 16px 6px 10px;font-size:12px;font-weight:700;margin-bottom:24px;box-shadow:0 2px 12px rgba(24,95,165,.1);animation:fade-up .6s ease both;}
.badge-dot{width:8px;height:8px;background:#22c55e;border-radius:50%;animation:pulse-dot 1.8s infinite;flex-shrink:0;}
.badge-dot-ring{width:14px;height:14px;border-radius:50%;background:rgba(34,197,94,.15);display:flex;align-items:center;justify-content:center;animation:glow-pulse 2.5s infinite;}
.hero h1{font-size:clamp(34px,4.8vw,60px);font-weight:900;line-height:1.08;letter-spacing:-1.5px;color:#0f172a;margin-bottom:22px;animation:fade-up .6s ease .1s both;}
.hero h1 .grad{background:linear-gradient(135deg,#185FA5 0%,#3b82f6 50%,#6366f1 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.hero-sub{font-size:clamp(15px,1.8vw,18px);color:#64748b;line-height:1.8;margin-bottom:36px;max-width:500px;animation:fade-up .6s ease .2s both;}
.hero-btns{display:flex;gap:12px;flex-wrap:wrap;animation:fade-up .6s ease .3s both;}
.btn-hero-main{padding:15px 30px;background:linear-gradient(135deg,#185FA5,#3b82f6);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:9px;box-shadow:0 6px 28px rgba(24,95,165,.35);transition:transform .15s,box-shadow .15s;}
.btn-hero-main:hover{transform:translateY(-2px);box-shadow:0 10px 36px rgba(24,95,165,.45);}
.btn-hero-sec{padding:15px 28px;background:#fff;color:#185FA5;border:1.5px solid #e2e8f0;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:border-color .15s,box-shadow .15s;}
.btn-hero-sec:hover{border-color:rgba(24,95,165,.3);box-shadow:0 4px 16px rgba(24,95,165,.1);}
.hero-note{margin-top:16px;font-size:12px;color:#94a3b8;animation:fade-up .6s ease .4s both;}
.hero-note span{color:#185FA5;font-weight:600;}
.hero-trust{display:flex;align-items:center;gap:10px;margin-top:28px;animation:fade-up .6s ease .5s both;}
.hero-trust-avatars{display:flex;}
.hero-trust-av{width:28px;height:28px;border-radius:50%;border:2px solid #fff;background:linear-gradient(135deg,#185FA5,#3b82f6);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;margin-left:-8px;}
.hero-trust-av:first-child{margin-left:0;}
.hero-trust-text{font-size:12px;color:#64748b;}
.hero-trust-text strong{color:#0f172a;}

/* ── MOCKUP 3D ── */
.mockup-scene{perspective:1200px;animation:slide-left .8s ease .2s both;}
.mockup-wrap{transform-style:preserve-3d;transition:transform .1s ease-out;will-change:transform;}
.mockup{background:#fff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 24px 80px rgba(15,23,42,.14),0 4px 24px rgba(15,23,42,.06);position:relative;}
.mockup::before{content:"";position:absolute;inset:0;border-radius:18px;box-shadow:inset 0 1px 0 rgba(255,255,255,.8);pointer-events:none;z-index:10;}
.mockup-bar{background:#f8fafc;padding:10px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #f1f5f9;}
.mock-dot{width:10px;height:10px;border-radius:50%;}
.mockup-title{font-size:11px;color:#94a3b8;margin-left:auto;font-weight:500;}
.mockup-body{padding:16px;}
.mock-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;}
.mock-stat-card{background:#f8fafc;border:1px solid #f1f5f9;border-radius:10px;padding:10px;text-align:center;}
.mock-stat-num{font-size:20px;font-weight:900;color:#185FA5;letter-spacing:-1px;}
.mock-stat-label{font-size:9px;color:#94a3b8;margin-top:2px;text-transform:uppercase;letter-spacing:.5px;}
.mock-table-header{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:6px;padding:6px 8px;font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #f1f5f9;margin-bottom:6px;}
.mock-row{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:6px;padding:7px 8px;border-radius:8px;font-size:11px;align-items:center;transition:background .15s;}
.mock-row:hover{background:#f8fafc;}
.mock-nome{color:#0f172a;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mock-evento{color:#64748b;font-size:10px;font-weight:600;}
.mock-badge{padding:2px 8px;border-radius:99px;font-size:9px;font-weight:700;text-align:center;white-space:nowrap;}
.mock-badge-ok{background:rgba(22,163,74,.1);color:#16a34a;border:1px solid rgba(22,163,74,.2);}
.mock-badge-pend{background:rgba(234,179,8,.1);color:#ca8a04;border:1px solid rgba(234,179,8,.2);}
.mock-badge-new{background:rgba(24,95,165,.1);color:#185FA5;border:1px solid rgba(24,95,165,.2);}
.mock-ai-bar{background:linear-gradient(90deg,rgba(24,95,165,.06),rgba(59,130,246,.04));border:1px solid rgba(24,95,165,.12);border-radius:8px;padding:8px 12px;margin-top:10px;display:flex;align-items:center;gap:8px;font-size:10px;color:#185FA5;font-weight:500;}
.mock-ai-dot{width:6px;height:6px;background:#22c55e;border-radius:50%;animation:pulse-dot 1.5s infinite;flex-shrink:0;}

/* Floating cards */
.float-card{position:absolute;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:10px 14px;box-shadow:0 8px 32px rgba(15,23,42,.1);font-size:11px;display:flex;align-items:center;gap:8px;white-space:nowrap;animation:float 4s ease-in-out infinite;}
.float-card-2{animation:float2 5s ease-in-out infinite .5s;}
.float-card-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}

/* ── LOGOS STRIP ── */
.logos-strip{background:#fff;border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9;padding:20px 24px;}
.logos-inner{max-width:1180px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;}
.logos-label{font-size:11px;color:#94a3b8;font-weight:500;text-transform:uppercase;letter-spacing:1px;margin-right:8px;}
.logo-chip{display:flex;align-items:center;gap:7px;background:#f8fafc;border:1px solid #f1f5f9;border-radius:99px;padding:7px 14px;font-size:12px;font-weight:700;color:#475569;}

/* ── STATS ── */
.stats-section{padding:72px 24px;background:#fff;}
.stats-inner{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:0;}
.stat-item{text-align:center;padding:24px 32px;position:relative;}
.stat-item:not(:last-child)::after{content:"";position:absolute;right:0;top:20%;height:60%;width:1px;background:#f1f5f9;}
.stat-num{font-size:44px;font-weight:900;background:linear-gradient(135deg,#185FA5,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-2px;line-height:1;}
.stat-label{font-size:13px;color:#64748b;margin-top:6px;font-weight:500;}

/* ── SECTION COMMON ── */
.section-wrap{max-width:1180px;margin:0 auto;padding:80px 24px;}
.section-center{text-align:center;}
.section-label{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#185FA5;margin-bottom:14px;}
.section-label::before{content:"";width:24px;height:2px;background:linear-gradient(90deg,#185FA5,#3b82f6);border-radius:2px;}
.section-h2{font-size:clamp(26px,3.5vw,44px);font-weight:900;color:#0f172a;line-height:1.15;margin-bottom:14px;letter-spacing:-.5px;}
.section-h2 .grad{background:linear-gradient(135deg,#185FA5,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.section-desc{font-size:16px;color:#64748b;line-height:1.8;max-width:520px;margin:0 auto 56px;}

/* ── EVENTS ── */
.events-bg{background:#f8fafc;padding:80px 0;}
.events-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;}
.event-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;transition:box-shadow .2s,transform .2s,border-color .2s;cursor:default;position:relative;overflow:hidden;}
.event-card::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#185FA5,#3b82f6);border-radius:2px 2px 0 0;}
.event-card:hover{box-shadow:0 12px 40px rgba(24,95,165,.12);transform:translateY(-5px);border-color:rgba(24,95,165,.2);}
.event-code{display:inline-block;padding:5px 12px;border-radius:8px;font-size:12px;font-weight:800;background:linear-gradient(135deg,#185FA5,#3b82f6);color:#fff;margin-bottom:14px;font-family:monospace;letter-spacing:.5px;box-shadow:0 4px 12px rgba(24,95,165,.25);}
.event-card h3{font-size:16px;font-weight:800;color:#0f172a;margin-bottom:8px;}
.event-card p{font-size:13px;color:#64748b;line-height:1.7;}

/* ── AI SECTION ── */
.ai-section{background:#fff;padding:80px 0;}
.ai-inner{max-width:1180px;margin:0 auto;padding:0 24px;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;}
.ai-steps{display:flex;flex-direction:column;gap:0;margin-top:32px;}
.ai-step{display:flex;gap:16px;position:relative;padding-bottom:28px;}
.ai-step:not(:last-child)::before{content:"";position:absolute;left:20px;top:42px;bottom:0;width:2px;background:linear-gradient(to bottom,#185FA5,rgba(59,130,246,.1));}
.ai-step-icon{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:linear-gradient(135deg,rgba(24,95,165,.1),rgba(59,130,246,.1));border:1.5px solid rgba(24,95,165,.15);}
.ai-step-text h4{font-size:15px;font-weight:700;color:#0f172a;margin-bottom:3px;}
.ai-step-text p{font-size:13px;color:#64748b;line-height:1.65;}
.ai-panel{background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 8px 40px rgba(15,23,42,.08);}
.ai-panel-bar{background:#fff;padding:10px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #f1f5f9;}
.ai-panel-body{padding:20px;}
.ai-file-card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(15,23,42,.04);}
.ai-file-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#185FA5;margin-bottom:10px;display:flex;align-items:center;gap:6px;}
.ai-field{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#94a3b8;margin-bottom:5px;padding-bottom:5px;border-bottom:1px solid #f8fafc;}
.ai-field:last-child{border:none;margin:0;padding:0;}
.ai-field-val{color:#0f172a;font-weight:600;}
.ai-status-bar{display:flex;align-items:center;gap:8px;background:rgba(22,163,74,.06);border:1px solid rgba(22,163,74,.2);border-radius:8px;padding:10px 14px;font-size:11px;color:#16a34a;font-weight:600;}

/* ── FEATURES ── */
.features-bg{background:#f8fafc;padding:80px 0;}
.features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;}
.feat-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;transition:box-shadow .2s,transform .2s,border-color .2s;cursor:default;}
.feat-card:hover{box-shadow:0 12px 40px rgba(24,95,165,.1);transform:translateY(-4px);border-color:rgba(24,95,165,.2);}
.feat-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:18px;flex-shrink:0;}
.feat-card h3{font-size:15px;font-weight:800;color:#0f172a;margin-bottom:8px;}
.feat-card p{font-size:13px;color:#64748b;line-height:1.7;}

/* ── HOW IT WORKS ── */
.how-section{background:#fff;padding:80px 0;}
.steps-flow{display:flex;gap:0;align-items:flex-start;flex-wrap:wrap;margin-top:8px;}
.step-item{flex:1;min-width:200px;text-align:center;padding:0 20px;position:relative;}
.step-item:not(:last-child)::after{content:"";position:absolute;right:-1px;top:24px;width:50%;height:2px;background:linear-gradient(90deg,rgba(24,95,165,.3),rgba(59,130,246,.15));}
.step-num{width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,#185FA5,#3b82f6);color:#fff;font-size:20px;font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;box-shadow:0 6px 20px rgba(24,95,165,.3);}
.step-item h3{font-size:14px;font-weight:800;color:#0f172a;margin-bottom:8px;}
.step-item p{font-size:12px;color:#64748b;line-height:1.7;}

/* ── PRICING ── */
.pricing-bg{background:#f8fafc;padding:80px 0;}
.pricing-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;max-width:940px;margin:0 auto;}
.price-card{background:#fff;border:1.5px solid #e2e8f0;border-radius:18px;padding:32px;position:relative;transition:box-shadow .2s,transform .2s;}
.price-card:hover{transform:translateY(-4px);}
.price-card.featured{border-color:#185FA5;box-shadow:0 0 0 4px rgba(24,95,165,.08),0 12px 40px rgba(24,95,165,.15);}
.price-pill{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#185FA5,#3b82f6);color:#fff;font-size:11px;font-weight:700;padding:4px 18px;border-radius:99px;white-space:nowrap;box-shadow:0 4px 12px rgba(24,95,165,.3);}
.price-plan{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;margin-bottom:10px;}
.price-amount{font-size:42px;font-weight:900;color:#0f172a;margin-bottom:4px;letter-spacing:-2px;}
.price-amount span{font-size:14px;font-weight:400;color:#94a3b8;}
.price-desc{font-size:13px;color:#64748b;margin-bottom:24px;line-height:1.6;}
.price-list{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:28px;}
.price-list li{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:#475569;}
.chk{color:#16a34a;font-weight:800;flex-shrink:0;font-size:14px;}
.price-btn{width:100%;padding:14px;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;text-decoration:none;display:block;text-align:center;transition:transform .15s,box-shadow .15s;}
.price-btn-main{background:linear-gradient(135deg,#185FA5,#3b82f6);color:#fff;border:none;box-shadow:0 4px 16px rgba(24,95,165,.25);}
.price-btn-main:hover{transform:translateY(-1px);box-shadow:0 8px 28px rgba(24,95,165,.35);}
.price-btn-ghost{background:transparent;color:#185FA5;border:1.5px solid rgba(24,95,165,.25);}
.price-btn-ghost:hover{border-color:#185FA5;background:rgba(24,95,165,.04);}

/* ── TESTIMONIALS ── */
.testi-section{background:#fff;padding:80px 0;}
.testi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;}
.testi-card{background:#f8fafc;border:1px solid #f1f5f9;border-radius:16px;padding:28px;transition:box-shadow .2s,border-color .2s;}
.testi-card:hover{box-shadow:0 8px 32px rgba(24,95,165,.08);border-color:rgba(24,95,165,.15);}
.testi-stars{color:#f59e0b;font-size:14px;margin-bottom:12px;letter-spacing:1px;}
.testi-card p{font-size:14px;color:#475569;line-height:1.8;margin-bottom:18px;font-style:italic;}
.testi-author{display:flex;align-items:center;gap:12px;}
.testi-avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#185FA5,#3b82f6);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0;}
.testi-name{font-size:13px;font-weight:700;color:#0f172a;}
.testi-role{font-size:11px;color:#94a3b8;margin-top:2px;}

/* ── DEMO SECTION ── */
.demo-section{background:#fff;padding:80px 0;border-top:1px solid #f1f5f9;}
@keyframes progress-bar{from{width:0}to{width:100%}}
@keyframes typing-cursor{0%,100%{opacity:1}50%{opacity:0}}
@keyframes check-in{from{transform:scale(0) rotate(-45deg);opacity:0}to{transform:scale(1) rotate(0deg);opacity:1}}
@keyframes field-appear{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
@keyframes send-pulse{0%{box-shadow:0 0 0 0 rgba(22,163,74,.5)}70%{box-shadow:0 0 0 14px rgba(22,163,74,0)}100%{box-shadow:0 0 0 0 rgba(22,163,74,0)}}
@keyframes slide-up-fade{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.demo-panel{background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;box-shadow:0 12px 48px rgba(15,23,42,.09);}
.demo-panel-bar{background:#fff;padding:10px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #f1f5f9;}
.demo-panel-body{padding:20px;min-height:360px;display:flex;flex-direction:column;gap:12px;}
.demo-step-tabs{display:flex;gap:4px;margin-bottom:4px;}
.demo-tab{flex:1;padding:6px 4px;border-radius:8px;font-size:10px;font-weight:700;text-align:center;transition:background .3s,color .3s;color:#94a3b8;background:transparent;border:none;cursor:default;}
.demo-tab.active{background:linear-gradient(135deg,#185FA5,#3b82f6);color:#fff;}
.demo-tab.done{background:rgba(22,163,74,.1);color:#16a34a;}
.demo-card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;box-shadow:0 2px 8px rgba(15,23,42,.04);}
.demo-card-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#185FA5;margin-bottom:10px;display:flex;align-items:center;gap:6px;}
.demo-field{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#94a3b8;padding:4px 0;border-bottom:1px solid #f8fafc;}
.demo-field:last-child{border:none;}
.demo-field-val{color:#0f172a;font-weight:600;font-size:11px;}
.demo-progress-wrap{background:#f1f5f9;border-radius:99px;height:6px;overflow:hidden;margin:6px 0;}
.demo-progress-bar{height:100%;border-radius:99px;background:linear-gradient(90deg,#185FA5,#3b82f6);}
.demo-upload-zone{border:2px dashed #e2e8f0;border-radius:12px;padding:24px;text-align:center;transition:border-color .3s,background .3s;}
.demo-upload-zone.active{border-color:#185FA5;background:rgba(24,95,165,.04);}
.demo-success-bar{display:flex;align-items:center;gap:10px;background:rgba(22,163,74,.06);border:1px solid rgba(22,163,74,.2);border-radius:10px;padding:12px 14px;font-size:12px;color:#16a34a;font-weight:600;}
.demo-restart-btn{width:100%;padding:10px;border:1.5px solid rgba(24,95,165,.2);background:transparent;border-radius:10px;font-size:12px;font-weight:600;color:#185FA5;cursor:pointer;transition:background .15s,border-color .15s;margin-top:4px;}
.demo-restart-btn:hover{background:rgba(24,95,165,.05);border-color:#185FA5;}
@media(max-width:860px){
  .demo-section .section-wrap>div{grid-template-columns:1fr !important;gap:36px !important;}
}

/* ── BLOG STRIP ── */
.blog-section{background:#f8fafc;padding:72px 0;}
.blog-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;}
.blog-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;text-decoration:none;color:inherit;transition:box-shadow .2s,transform .2s,border-color .2s;display:flex;flex-direction:column;}
.blog-card:hover{box-shadow:0 10px 36px rgba(24,95,165,.1);transform:translateY(-4px);border-color:rgba(24,95,165,.2);}
.blog-card-top{height:6px;background:linear-gradient(90deg,#185FA5,#3b82f6);}
.blog-card-body{padding:22px;flex:1;}
.blog-tag{display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#185FA5;background:rgba(24,95,165,.08);padding:3px 10px;border-radius:99px;margin-bottom:12px;}
.blog-card h3{font-size:15px;font-weight:800;color:#0f172a;line-height:1.4;margin-bottom:8px;}
.blog-card p{font-size:12px;color:#64748b;line-height:1.7;}
.blog-card-foot{padding:14px 22px;border-top:1px solid #f8fafc;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between;}
.blog-more{font-size:12px;font-weight:600;color:#185FA5;}

/* ── CONTACT ── */
.contact-section{background:#fff;padding:72px 24px;text-align:center;border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9;}
.social-bar{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:36px;}
.social-btn{display:flex;align-items:center;gap:10px;padding:13px 22px;border-radius:12px;font-size:14px;font-weight:700;text-decoration:none;transition:transform .15s,box-shadow .15s;border:none;cursor:pointer;white-space:nowrap;}
.social-btn:hover{transform:translateY(-3px);}
.s-phone{background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;box-shadow:0 4px 18px rgba(22,163,74,.25);}
.s-phone:hover{box-shadow:0 8px 28px rgba(22,163,74,.4);}
.s-email{background:linear-gradient(135deg,#185FA5,#3b82f6);color:#fff;box-shadow:0 4px 18px rgba(24,95,165,.25);}
.s-email:hover{box-shadow:0 8px 28px rgba(24,95,165,.4);}
.s-ig{background:linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);color:#fff;box-shadow:0 4px 18px rgba(220,39,67,.25);}
.s-ig:hover{box-shadow:0 8px 28px rgba(220,39,67,.4);}
.s-fb{background:linear-gradient(135deg,#1565c0,#1877f2);color:#fff;box-shadow:0 4px 18px rgba(24,119,242,.25);}
.s-fb:hover{box-shadow:0 8px 28px rgba(24,119,242,.4);}

/* ── CTA ── */
.cta-section{padding:100px 24px;text-align:center;background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f2d52 100%);position:relative;overflow:hidden;}
.cta-blob{position:absolute;width:600px;height:600px;background:radial-gradient(circle,rgba(59,130,246,.15) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;}
.cta-blob2{position:absolute;width:300px;height:300px;background:radial-gradient(circle,rgba(99,102,241,.1) 0%,transparent 70%);top:0;right:0;pointer-events:none;}
.cta-h2{font-size:clamp(28px,4.5vw,54px);font-weight:900;color:#fff;margin-bottom:16px;letter-spacing:-.5px;position:relative;}
.cta-h2 .grad{background:linear-gradient(135deg,#60a5fa,#93c5fd);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.cta-sub{font-size:17px;color:rgba(255,255,255,.6);margin-bottom:40px;max-width:460px;margin-left:auto;margin-right:auto;line-height:1.75;position:relative;}
.cta-btns{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;position:relative;}
.cta-note{margin-top:20px;font-size:12px;color:rgba(255,255,255,.3);position:relative;}

/* ── FOOTER ── */
footer{background:#0f172a;padding:56px 24px 32px;}
.footer-inner{max-width:1180px;margin:0 auto;}
.footer-top{display:flex;justify-content:space-between;gap:40px;flex-wrap:wrap;margin-bottom:40px;}
.footer-logo-text{font-size:15px;font-weight:800;color:#e2e8f0;}
.footer-logo-text span{color:#3b82f6;}
.footer-brand-desc{font-size:13px;color:#334155;line-height:1.7;margin-top:10px;max-width:240px;}
.footer-col h4{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#334155;margin-bottom:14px;}
.footer-col ul{list-style:none;display:flex;flex-direction:column;gap:8px;}
.footer-col a{font-size:13px;color:#334155;text-decoration:none;transition:color .15s;}
.footer-col a:hover{color:#64748b;}
.footer-bottom{border-top:1px solid rgba(255,255,255,.05);padding-top:20px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-size:12px;color:#1e293b;}

/* ── REVEAL ── */
.reveal{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease;}
.reveal.visible{opacity:1;transform:translateY(0);}

/* ── RESPONSIVE ── */
@media(max-width:960px){
  .hero-inner{grid-template-columns:1fr;gap:40px;text-align:center;}
  .mockup-scene{display:none;}
  .hero-sub{margin:0 auto 32px;}
  .hero-btns{justify-content:center;}
  .hero-note,.hero-trust{justify-content:center;}
  .hero-trust{justify-content:center;}
  .ai-inner{grid-template-columns:1fr;gap:40px;}
  .stats-inner{grid-template-columns:1fr 1fr;}
  .stat-item:not(:last-child)::after{display:none;}
  .stat-item:nth-child(1),.stat-item:nth-child(2){border-bottom:1px solid #f1f5f9;}
  .stat-item:nth-child(1),.stat-item:nth-child(3){border-right:1px solid #f1f5f9;}
  .steps-flow{gap:24px;}
  .step-item:not(:last-child)::after{display:none;}
}
@media(max-width:640px){
  .nav-links,.nav-cta{display:none;}
  .nav-mobile-btn{display:flex;}
  .nav-inner{padding:0 16px;}
  .hero{padding:80px 16px 56px;}
  .hero h1{font-size:32px;letter-spacing:-.5px;}
  .hero-btns{flex-direction:column;align-items:stretch;}
  .btn-hero-main,.btn-hero-sec{justify-content:center;text-align:center;}
  .section-wrap{padding:56px 16px;}
  .events-grid,.features-grid,.testi-grid,.blog-grid{grid-template-columns:1fr;}
  .pricing-grid{grid-template-columns:1fr;}
  .steps-flow{flex-direction:column;align-items:center;}
  .step-item{min-width:unset;width:100%;max-width:300px;padding:0 16px 28px;}
  .social-bar{flex-direction:column;align-items:stretch;}
  .social-btn{justify-content:center;}
  .cta-btns{flex-direction:column;align-items:stretch;}
  .cta-btns a{justify-content:center;}
  .footer-top{flex-direction:column;gap:28px;}
  .footer-bottom{flex-direction:column;align-items:center;text-align:center;}
  .stat-num{font-size:34px;}
  .logos-inner{gap:8px;}
}
`

const MOCK_ROWS = [
  { nome: 'João Silva Santos',   evento: 'S-2220', status: 'ok',   label: 'Transmitido' },
  { nome: 'Ana Paula Ferreira',  evento: 'S-2240', status: 'pend', label: 'Pendente' },
  { nome: 'Carlos E. Lima',      evento: 'S-2210', status: 'ok',   label: 'Transmitido' },
  { nome: 'Fernanda Rocha',      evento: 'S-2220', status: 'new',  label: 'Novo ASO' },
  { nome: 'Roberto Mendes',      evento: 'S-2240', status: 'ok',   label: 'Transmitido' },
]

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const dur = 1800, steps = 60, inc = target / steps
        let cur = 0
        const t = setInterval(() => {
          cur = Math.min(cur + inc, target)
          setCount(Math.round(cur))
          if (cur >= target) clearInterval(t)
        }, dur / steps)
      }
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target])
  return <div ref={ref} className="stat-num">{count}{suffix}</div>
}

// ─── 3D TILT HOOK ────────────────────────────────────────────────────────────
function useTilt(strength = 8) {
  const ref = useRef<HTMLDivElement>(null)
  const handleMove = useCallback((e: MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `rotateY(${x * strength}deg) rotateX(${-y * strength}deg) scale(1.02)`
  }, [strength])
  const handleLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = 'rotateY(0) rotateX(0) scale(1)'
  }, [])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('mousemove', handleMove)
    el.addEventListener('mouseleave', handleLeave)
    return () => { el.removeEventListener('mousemove', handleMove); el.removeEventListener('mouseleave', handleLeave) }
  }, [handleMove, handleLeave])
  return ref
}

// ─── REVEAL HOOK ────────────────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.12 })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

// ─── LIVE DEMO ───────────────────────────────────────────────────────────────
const DEMO_FIELDS = [
  { label:'Funcionário', value:'João Silva Santos' },
  { label:'CPF', value:'123.456.789-00' },
  { label:'Tipo', value:'ASO Admissional' },
  { label:'Médico', value:'Dr. Roberto Lima' },
  { label:'CRM', value:'SP-42891' },
  { label:'Data', value:'04/06/2026' },
  { label:'Resultado', value:'Apto', green:true },
]

function LiveDemo() {
  // step: 0=idle, 1=uploading, 2=extracting, 3=review, 4=transmitting, 5=done
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [visibleFields, setVisibleFields] = useState(0)
  const [txProgress, setTxProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clear() {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  function delay(ms: number) {
    return new Promise<void>(resolve => { timerRef.current = setTimeout(resolve, ms) })
  }

  async function runDemo() {
    clear()
    setStep(1); setProgress(0); setVisibleFields(0); setTxProgress(0)
    // upload progress
    for (let p = 0; p <= 100; p += 5) {
      await delay(60)
      setProgress(p)
    }
    await delay(300)
    setStep(2); setProgress(0)
    // AI extraction progress
    for (let p = 0; p <= 100; p += 3) {
      await delay(50)
      setProgress(p)
    }
    await delay(200)
    setStep(3)
    // reveal fields one by one
    for (let i = 1; i <= DEMO_FIELDS.length; i++) {
      await delay(220)
      setVisibleFields(i)
    }
    await delay(800)
    setStep(4); setTxProgress(0)
    for (let p = 0; p <= 100; p += 4) {
      await delay(55)
      setTxProgress(p)
    }
    await delay(300)
    setStep(5)
  }

  function reset() {
    clear(); setStep(0); setProgress(0); setVisibleFields(0); setTxProgress(0)
  }

  const tabs = ['Upload', 'IA Extrai', 'Revisão', 'Transmitindo', 'Concluído']
  const activeTab = step === 0 ? -1 : step <= 1 ? 0 : step === 2 ? 1 : step === 3 ? 2 : step === 4 ? 3 : 4

  return (
    <div className="demo-panel">
      <div className="demo-panel-bar">
        <div style={{ width:10, height:10, borderRadius:'50%', background:'#f87171' }} />
        <div style={{ width:10, height:10, borderRadius:'50%', background:'#fbbf24' }} />
        <div style={{ width:10, height:10, borderRadius:'50%', background:'#4ade80' }} />
        <span style={{ marginLeft:8, fontSize:11, color:'#94a3b8', fontFamily:'monospace', fontWeight:500 }}>
          eSocial SST · demo interativa
        </span>
      </div>
      <div className="demo-panel-body">
        {/* tabs */}
        <div className="demo-step-tabs">
          {tabs.map((t, i) => (
            <div key={t} className={`demo-tab${activeTab === i ? ' active' : activeTab > i ? ' done' : ''}`}>
              {activeTab > i ? '✓' : t}
            </div>
          ))}
        </div>

        {/* IDLE */}
        {step === 0 && (
          <div className="demo-upload-zone" style={{ marginTop:8 }}>
            <div style={{ fontSize:28, marginBottom:10 }}>📄</div>
            <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:4 }}>ASO_joao_silva.pdf</div>
            <div style={{ fontSize:11, color:'#94a3b8', marginBottom:16 }}>248 KB · PDF · ASO Admissional</div>
            <button
              onClick={runDemo}
              style={{ padding:'10px 24px', background:'linear-gradient(135deg,#185FA5,#3b82f6)', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 16px rgba(24,95,165,.3)' }}
            >
              ▶ Iniciar demonstração
            </button>
          </div>
        )}

        {/* STEP 1 — upload */}
        {step === 1 && (
          <div className="demo-card" style={{ animation:'slide-up-fade .3s ease' }}>
            <div className="demo-card-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
              Recebendo arquivo...
            </div>
            <div className="demo-field"><span>Arquivo</span><span className="demo-field-val">ASO_joao_silva.pdf</span></div>
            <div className="demo-field"><span>Tamanho</span><span className="demo-field-val">248 KB</span></div>
            <div className="demo-field"><span>Tipo detectado</span><span className="demo-field-val" style={{ color:'#185FA5' }}>PDF · eSocial S-2220</span></div>
            <div style={{ marginTop:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#94a3b8', marginBottom:4 }}>
                <span>Enviando...</span><span>{progress}%</span>
              </div>
              <div className="demo-progress-wrap">
                <div className="demo-progress-bar" style={{ width:`${progress}%`, transition:'width .05s linear' }} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — AI extracting */}
        {step === 2 && (
          <div className="demo-card" style={{ animation:'slide-up-fade .3s ease' }}>
            <div className="demo-card-title">
              <span style={{ animation:'spin-slow 1.5s linear infinite', display:'inline-block' }}>⚙️</span>
              Claude IA processando...
            </div>
            <div style={{ fontSize:12, color:'#64748b', marginBottom:12 }}>Lendo documento e identificando campos do ASO...</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {['Identificando tipo de exame...','Extraindo dados do trabalhador...','Localizando CRM e médico...','Verificando resultado do exame...'].map((msg, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color: progress > i*25 ? '#16a34a' : '#94a3b8', transition:'color .3s' }}>
                  <span style={{ fontSize:10 }}>{progress > i*25 ? '✓' : '○'}</span>{msg}
                </div>
              ))}
            </div>
            <div style={{ marginTop:12 }}>
              <div className="demo-progress-wrap">
                <div className="demo-progress-bar" style={{ width:`${progress}%`, transition:'width .05s linear', background:'linear-gradient(90deg,#7c3aed,#3b82f6)' }} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — review */}
        {step === 3 && (
          <div className="demo-card" style={{ animation:'slide-up-fade .3s ease' }}>
            <div className="demo-card-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg>
              Dados extraídos pela IA
            </div>
            {DEMO_FIELDS.slice(0, visibleFields).map((f, i) => (
              <div key={i} className="demo-field" style={{ animation:'field-appear .25s ease' }}>
                <span>{f.label}</span>
                <span className="demo-field-val" style={f.green ? { color:'#16a34a' } : {}}>{f.value}</span>
              </div>
            ))}
            {visibleFields < DEMO_FIELDS.length && (
              <div style={{ height:20, display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#185FA5', animation:'pulse-dot .8s infinite', display:'inline-block' }} />
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#185FA5', animation:'pulse-dot .8s infinite .2s', display:'inline-block' }} />
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#185FA5', animation:'pulse-dot .8s infinite .4s', display:'inline-block' }} />
              </div>
            )}
          </div>
        )}

        {/* STEP 4 — transmitting */}
        {step === 4 && (
          <div className="demo-card" style={{ animation:'slide-up-fade .3s ease' }}>
            <div className="demo-card-title">
              <span>📡</span> Transmitindo ao eSocial gov.br...
            </div>
            <div className="demo-field"><span>Evento</span><span className="demo-field-val">S-2220</span></div>
            <div className="demo-field"><span>Ambiente</span><span className="demo-field-val">Produção</span></div>
            <div className="demo-field"><span>Assinatura</span><span className="demo-field-val" style={{ color:'#16a34a' }}>ICP-Brasil ✓</span></div>
            <div style={{ marginTop:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#94a3b8', marginBottom:4 }}>
                <span>Enviando XML ao servidor...</span><span>{txProgress}%</span>
              </div>
              <div className="demo-progress-wrap">
                <div className="demo-progress-bar" style={{ width:`${txProgress}%`, transition:'width .05s linear', background:'linear-gradient(90deg,#16a34a,#22c55e)' }} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5 — done */}
        {step === 5 && (
          <div style={{ animation:'slide-up-fade .4s ease', display:'flex', flexDirection:'column', gap:10 }}>
            <div className="demo-success-bar" style={{ animation:'send-pulse .6s ease' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(22,163,74,.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" style={{ animation:'check-in .4s ease' }}><polyline points="20,6 9,17 4,12"/></svg>
              </div>
              <div>
                <div style={{ fontWeight:700 }}>S-2220 transmitido com sucesso!</div>
                <div style={{ fontSize:10, color:'#4ade80', fontWeight:400, marginTop:1 }}>Recibo: 1-2b3c4d5e · {new Date().toLocaleDateString('pt-BR')}</div>
              </div>
            </div>
            <div className="demo-card" style={{ padding:'10px 14px' }}>
              <div style={{ fontSize:10, color:'#94a3b8', marginBottom:6, fontWeight:700, textTransform:'uppercase', letterSpacing:'1px' }}>Resumo do envio</div>
              {[
                { l:'Funcionário', v:'João Silva Santos' },
                { l:'Evento', v:'S-2220 · ASO Admissional' },
                { l:'Status eSocial', v:'Processado', c:'#16a34a' },
                { l:'XML salvo', v:'✓ Disponível para download' },
              ].map((f,i) => (
                <div key={i} className="demo-field">
                  <span>{f.l}</span>
                  <span className="demo-field-val" style={f.c ? { color:f.c } : {}}>{f.v}</span>
                </div>
              ))}
            </div>
            <button className="demo-restart-btn" onClick={reset}>↺ Ver demonstração novamente</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [aiStep, setAiStep] = useState(0)
  const tiltRef = useTilt(6)
  useReveal()

  useEffect(() => {
    const t = setInterval(() => setAiStep(s => (s + 1) % 3), 2400)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
      <Head>
        <title>eSocial SST — Transmissão automática com IA</title>
        <meta name="description" content="Transmita os eventos SST do eSocial (S-2210, S-2220, S-2221, S-2240) com inteligência artificial. Leia PDF de LTCAT, PCMSO e ASO automaticamente." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="eSocial SST — Transmissão automática com IA" />
        <meta property="og:description" content="Transmita os eventos SST do eSocial com IA. Leia PDF de LTCAT, PCMSO e ASO automaticamente." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://esocial-sst.vercel.app" />
        <link rel="canonical" href="https://esocial-sst.vercel.app" />
        <meta name="keywords" content="esocial sst, transmissão esocial sst, s-2220 esocial, s-2240 esocial, s-2210 esocial, software esocial sst, aso esocial, ltcat esocial, certificado digital esocial, automatizar esocial sst" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'eSocial SST',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          url: 'https://esocial-sst.vercel.app',
          description: 'Software SaaS brasileiro para transmissão automática de eventos de Saúde e Segurança do Trabalho (SST) ao eSocial Gov.br.',
          offers: { '@type': 'AggregateOffer', lowPrice: '49', highPrice: '197', priceCurrency: 'BRL' },
          featureList: ['Leitura de PDF com IA (ASO, LTCAT, CAT)', 'Transmissão S-2210, S-2220, S-2221, S-2240', 'Assinatura digital ICP-Brasil', 'Alertas de vencimento', 'Multi-empresa', 'Trial 14 dias grátis'],
          aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '12' },
        }) }} />
        <style dangerouslySetInnerHTML={{ __html: globalCSS }} />
      </Head>

      {/* ── NAV ── */}
      <nav className={scrolled ? 'scrolled' : ''}>
        <div className="nav-inner">
          <a href="#" className="nav-logo">
            <img src="/logo-completa.png" alt="DSEG Consultoria em SST" style={{ height:72, width:'auto' }} />
          </a>
          <div className="nav-links">
            <a href="#eventos">Eventos SST</a>
            <a href="#ia">IA &amp; Documentos</a>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#precos">Preços</a>
            <Link href="/noticias">Blog</Link>
            <a href="#contato">Contato</a>
          </div>
          <div className="nav-cta">
            <Link href="/login" className="btn-ghost">Entrar</Link>
            <Link href="/cadastro" className="btn-primary">Testar grátis →</Link>
          </div>
          <button className="nav-mobile-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2">
              {menuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
              }
            </svg>
          </button>
        </div>
        {menuOpen && (
          <div style={{ background:'#fff', borderTop:'1px solid #f1f5f9', padding:'16px 20px', display:'flex', flexDirection:'column', gap:4 }}>
            {[['#eventos','Eventos SST'],['#ia','IA & Documentos'],['#funcionalidades','Funcionalidades'],['#precos','Preços'],['/noticias','Blog'],['#contato','Contato']].map(([href,label]) => (
              href.startsWith('/') ? (
                <Link key={href} href={href} style={{ fontSize:14, color:'#475569', textDecoration:'none', padding:'9px 8px', borderRadius:8 }} onClick={() => setMenuOpen(false)}>{label}</Link>
              ) : (
                <a key={href} href={href} style={{ fontSize:14, color:'#475569', textDecoration:'none', padding:'9px 8px', borderRadius:8 }} onClick={() => setMenuOpen(false)}>{label}</a>
              )
            ))}
            <div style={{ display:'flex', gap:8, paddingTop:12, borderTop:'1px solid #f1f5f9', marginTop:8 }}>
              <Link href="/login" style={{ flex:1, textAlign:'center', textDecoration:'none', padding:'10px', fontSize:13, fontWeight:600, color:'#475569', border:'1.5px solid #e2e8f0', borderRadius:10 }}>Entrar</Link>
              <Link href="/cadastro" style={{ flex:1, textAlign:'center', textDecoration:'none', padding:'10px', fontSize:13, fontWeight:700, color:'#fff', background:'linear-gradient(135deg,#185FA5,#3b82f6)', borderRadius:10 }}>Testar grátis</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-blob1"></div>
        <div className="hero-blob2"></div>
        <div className="hero-blob3"></div>
        <div className="hero-dots"></div>
        <div className="hero-inner">
          {/* Left */}
          <div>
            <div className="hero-badge">
              <div className="badge-dot-ring"><span className="badge-dot"></span></div>
              Sistema ao vivo · 100% conforme eSocial
            </div>
            <h1>
              Transmita o<br />
              <span className="grad">eSocial SST</span><br />
              com Inteligência<br />Artificial
            </h1>
            <p className="hero-sub">
              Envie S-2210, S-2220, S-2221 e S-2240 diretamente ao governo.
              Importe PDF de LTCAT, PCMSO e ASO — a IA extrai e preenche tudo automaticamente.
            </p>
            <div className="hero-btns">
              <Link href="/cadastro" className="btn-hero-main">
                Começar trial grátis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>
              </Link>
              <a href="#ia" className="btn-hero-sec">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16 10,8"/></svg>
                Ver como funciona
              </a>
            </div>
            <p className="hero-note">
              <span>14 dias grátis</span> · Sem cartão de crédito · Cancele quando quiser
            </p>
            <div className="hero-trust">
              <div className="hero-trust-avatars">
                {['MC','RF','PS','JB'].map((init,i) => (
                  <div key={i} className="hero-trust-av" style={{ background: i%2===0 ? 'linear-gradient(135deg,#185FA5,#3b82f6)' : 'linear-gradient(135deg,#0f2d52,#185FA5)' }}>{init}</div>
                ))}
              </div>
              <div className="hero-trust-text">
                <strong>+40 profissionais SST</strong> já usam a plataforma
              </div>
            </div>
          </div>

          {/* Right — Demo Interativa */}
          <div style={{ animation:'slide-left .8s ease .2s both' }}>
            <LiveDemo />
          </div>
        </div>
      </section>

      {/* ── LOGOS ── */}
      <div className="logos-strip">
        <div className="logos-inner">
          <span className="logos-label">Integra com</span>
          {[
            { icon:'🏛️', label:'eSocial Gov.br' },
            { icon:'🔐', label:'ICP-Brasil' },
            { icon:'🤖', label:'Claude AI' },
            { icon:'💳', label:'Stripe' },
            { icon:'📧', label:'Resend' },
          ].map(({ icon, label }) => (
            <div key={label} className="logo-chip">{icon} {label}</div>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="stats-section">
        <div className="stats-inner">
          {[
            { target:4,   suffix:'',  label:'Eventos SST suportados' },
            { target:3,   suffix:'',  label:'Documentos lidos por IA' },
            { target:14,  suffix:'d', label:'Trial gratuito' },
            { target:100, suffix:'%', label:'Conforme eSocial' },
          ].map((s,i) => (
            <div key={i} className="stat-item reveal">
              <Counter target={s.target} suffix={s.suffix} />
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── EVENTOS ── */}
      <section id="eventos" className="events-bg">
        <div className="section-wrap section-center">
          <div className="section-label">Eventos SST</div>
          <h2 className="section-h2">Todos os eventos de <span className="grad">saúde e segurança</span></h2>
          <p className="section-desc">Transmita cada obrigação SST diretamente ao eSocial com validação automática antes do envio.</p>
          <div className="events-grid">
            {[
              { code:'S-2210', title:'Comunicação de Acidente', desc:'Registro e transmissão de CAT com todos os campos exigidos. Notificação automática de prazos.' },
              { code:'S-2220', title:'Monitoramento de Saúde', desc:'ASO completo vinculado ao funcionário, tipo de exame, médico responsável e validade automática.' },
              { code:'S-2221', title:'Exame Toxicológico', desc:'Exame toxicológico de longa janela para motoristas profissionais, conforme Lei 12.619/2012.' },
              { code:'S-2240', title:'Condições Ambientais', desc:'Agentes nocivos, EPIs, EPCs e LTCAT registrados por função. Emitido nas mudanças obrigatórias.' },
            ].map((ev,i) => (
              <div key={i} className="event-card reveal">
                <div className="event-code">{ev.code}</div>
                <h3>{ev.title}</h3>
                <p>{ev.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IA SECTION ── */}
      <section id="ia" className="ai-section">
        <div className="ai-inner">
          <div className="reveal">
            <div className="section-label">Inteligência Artificial</div>
            <h2 className="section-h2">
              Importe um PDF.<br />
              <span className="grad">A IA faz o resto.</span>
            </h2>
            <p style={{ fontSize:15, color:'#64748b', lineHeight:1.8 }}>
              Envie qualquer PDF de LTCAT, PCMSO ou ASO. O sistema usa <strong style={{ color:'#0f172a' }}>Claude (Anthropic)</strong> para identificar o tipo, extrair os dados e preencher os campos automaticamente.
            </p>
            <div className="ai-steps">
              {[
                { icon:'📄', title:'Carregue o PDF', desc:'Arraste ou selecione o arquivo. Suporte a ASO, LTCAT ou PCMSO de qualquer formato.' },
                { icon:'🤖', title:'IA analisa e extrai', desc:'Claude lê o documento, identifica campos e extrai dados com alta precisão em segundos.' },
                { icon:'📡', title:'Transmita ao eSocial', desc:'Dados preenchidos automaticamente. Revise, assine e clique em transmitir.' },
              ].map((step,i) => (
                <div key={i} className="ai-step" style={{ opacity: aiStep === i ? 1 : 0.4, transition:'opacity .4s' }}>
                  <div className="ai-step-icon">
                    <span style={{ fontSize:17 }}>{step.icon}</span>
                  </div>
                  <div className="ai-step-text">
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="reveal">
            <div className="ai-panel">
              <div className="ai-panel-bar">
                <div style={{ width:10, height:10, borderRadius:'50%', background:'#f87171' }}></div>
                <div style={{ width:10, height:10, borderRadius:'50%', background:'#fbbf24' }}></div>
                <div style={{ width:10, height:10, borderRadius:'50%', background:'#4ade80' }}></div>
                <span style={{ marginLeft:8, fontSize:11, color:'#94a3b8', fontFamily:'monospace', fontWeight:500 }}>claude-extractor · processando...</span>
              </div>
              <div className="ai-panel-body">
                <div className="ai-file-card" style={{ opacity: aiStep === 0 ? 1 : 0.45, transition:'opacity .4s' }}>
                  <div className="ai-file-title">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
                    Arquivo recebido
                  </div>
                  <div className="ai-field"><span>Arquivo:</span><span className="ai-field-val">ASO_joao_silva.pdf</span></div>
                  <div className="ai-field"><span>Tamanho:</span><span className="ai-field-val">248 KB</span></div>
                  <div className="ai-field"><span>Tipo detectado:</span><span className="ai-field-val" style={{ color:'#16a34a' }}>ASO — Admissional</span></div>
                </div>
                <div className="ai-file-card" style={{ opacity: aiStep === 1 ? 1 : 0.45, transition:'opacity .4s' }}>
                  <div className="ai-file-title">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                    Extração por IA
                  </div>
                  <div className="ai-field"><span>Funcionário:</span><span className="ai-field-val">João Silva Santos</span></div>
                  <div className="ai-field"><span>CPF:</span><span className="ai-field-val">123.456.789-00</span></div>
                  <div className="ai-field"><span>Médico:</span><span className="ai-field-val">Dr. Roberto Lima</span></div>
                  <div className="ai-field"><span>CRM:</span><span className="ai-field-val">SP-42891</span></div>
                  <div className="ai-field"><span>Resultado:</span><span className="ai-field-val" style={{ color:'#16a34a' }}>Apto</span></div>
                </div>
                <div className="ai-status-bar" style={{ opacity: aiStep === 2 ? 1 : 0.45, transition:'opacity .4s' }}>
                  <div style={{ width:8, height:8, background:'#22c55e', borderRadius:'50%', animation:'pulse-dot 1.5s infinite', flexShrink:0 }}></div>
                  Pronto para transmitir ao eSocial gov.br
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ── */}
      <section id="funcionalidades" className="features-bg">
        <div className="section-wrap section-center">
          <div className="section-label">Funcionalidades</div>
          <h2 className="section-h2">Tudo para <span className="grad">cumprir o eSocial SST</span></h2>
          <p className="section-desc">Plataforma completa para médicos do trabalho, engenheiros de segurança e RH.</p>
          <div className="features-grid">
            {[
              { bg:'rgba(24,95,165,.1)', ic:'#185FA5', svg:<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>, title:'Transmissão gov.br', desc:'Envio direto ao eSocial com certificado digital A1. Recibo automático salvo em cada transmissão.' },
              { bg:'rgba(99,102,241,.1)', ic:'#6366f1', svg:<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>, title:'Multi-empresa', desc:'Gerencie várias empresas com um único login. Ideal para escritórios de SST e prestadores.' },
              { bg:'rgba(22,163,74,.1)', ic:'#16a34a', svg:<><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>, title:'Alertas de vencimento', desc:'Notificação por e-mail sobre ASOs próximos do vencimento. Evite autuações por exames vencidos.' },
              { bg:'rgba(245,158,11,.1)', ic:'#d97706', svg:<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>, title:'Painel administrativo', desc:'Visão completa do SaaS: clientes, planos, uso de IA, transmissões e status.' },
              { bg:'rgba(239,68,68,.1)', ic:'#dc2626', svg:<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></>, title:'Cadastro de funcionários', desc:'Base centralizada com CPF, função, CBO, setor e histórico de exames de toda a empresa.' },
              { bg:'rgba(20,184,166,.1)', ic:'#0d9488', svg:<polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>, title:'Histórico de transmissões', desc:'Consulte todos os eventos enviados, recibos, XML gerado e status de cada envio.' },
            ].map((f,i) => (
              <div key={i} className="feat-card reveal">
                <div className="feat-icon" style={{ background:f.bg }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={f.ic} strokeWidth="2">{f.svg}</svg>
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="how-section">
        <div className="section-wrap section-center">
          <div className="section-label">Como funciona</div>
          <h2 className="section-h2">Em <span className="grad">4 passos</span> simples</h2>
          <p className="section-desc">Do cadastro à transmissão em minutos, sem conhecimento técnico em XML.</p>
          <div className="steps-flow reveal">
            {[
              { n:'1', title:'Crie sua conta', desc:'Trial gratuito de 14 dias. Cadastre empresa e funcionários.' },
              { n:'2', title:'Importe ou preencha', desc:'Envie um PDF ou preencha o evento SST manualmente.' },
              { n:'3', title:'Valide com a IA', desc:'A IA verifica os dados e aponta inconsistências.' },
              { n:'4', title:'Transmita', desc:'Assina, envia ao gov.br e salva o recibo automaticamente.' },
            ].map((s,i) => (
              <div key={i} className="step-item">
                <div className="step-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREÇOS ── */}
      <section id="precos" className="pricing-bg">
        <div className="section-wrap section-center">
          <div className="section-label">Planos</div>
          <h2 className="section-h2">Simples e <span className="grad">transparente</span></h2>
          <p className="section-desc">Comece grátis e escolha o plano ideal para sua operação.</p>
          <div className="pricing-grid">
            <div className="price-card reveal">
              <div className="price-plan">Micro</div>
              <div className="price-amount">R$ 49<span>/mês</span></div>
              <p className="price-desc">50 envios incluídos · R$ 1,90 por envio extra.</p>
              <ul className="price-list" style={{ textAlign:'left' }}>
                {['50 envios/mês incluídos','Importação por IA (PDF)','ASO, LTCAT e PCMSO','Transmissão S-2210/2220/2221/2240','Alertas de vencimento','Exportação de PDF'].map((item,i) => (
                  <li key={i}><span className="chk">✓</span>{item}</li>
                ))}
              </ul>
              <Link href="/cadastro" className="price-btn price-btn-ghost">Começar grátis</Link>
            </div>
            <div className="price-card featured reveal">
              <div className="price-pill">Mais popular</div>
              <div className="price-plan">Starter</div>
              <div className="price-amount">R$ 97<span>/mês</span></div>
              <p className="price-desc">100 envios incluídos · R$ 1,50 por envio extra.</p>
              <ul className="price-list" style={{ textAlign:'left' }}>
                {['100 envios/mês incluídos','Tudo do Micro','Multi-empresa (até 5 CNPJs)','Convite de usuários','Relatórios avançados','Suporte por e-mail'].map((item,i) => (
                  <li key={i}><span className="chk">✓</span>{item}</li>
                ))}
              </ul>
              <Link href="/cadastro" className="price-btn price-btn-main">Começar grátis</Link>
            </div>
            <div className="price-card reveal">
              <div className="price-plan">Pro</div>
              <div className="price-amount">R$ 197<span>/mês</span></div>
              <p className="price-desc">400 envios incluídos · R$ 1,20 por envio extra.</p>
              <ul className="price-list" style={{ textAlign:'left' }}>
                {['400 envios/mês incluídos','Tudo do Starter','Até 10 CNPJs','Suporte prioritário','Onboarding dedicado','Envios excedentes automáticos'].map((item,i) => (
                  <li key={i}><span className="chk">✓</span>{item}</li>
                ))}
              </ul>
              <Link href="/cadastro" className="price-btn price-btn-ghost">Começar grátis</Link>
            </div>
          </div>
          <p style={{ textAlign:'center', marginTop:28, fontSize:12, color:'#94a3b8' }}>
            Todos os planos incluem 14 dias grátis · Mensalidade fixa + envios incluídos · Cancele quando quiser
          </p>
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section className="testi-section">
        <div className="section-wrap section-center">
          <div className="section-label">Depoimentos</div>
          <h2 className="section-h2">Quem já usa o <span className="grad">eSocial SST</span></h2>
          <p className="section-desc">Profissionais de SST economizando horas por semana em todo o Brasil.</p>
          <div className="testi-grid">
            {[
              { init:'MC', nome:'Márcia C.', role:'Médica do Trabalho · São Paulo', text:'Antes gastava horas preenchendo XML. Agora importo o PDF do ASO e em segundos está pronto para transmitir. Incrível.' },
              { init:'RF', nome:'Ricardo F.', role:'Engenheiro de Segurança · Curitiba', text:'Gerencio 12 empresas aqui. O multi-empresa é perfeito — cada uma isolada mas acesso tudo com um login só.' },
              { init:'PS', nome:'Patricia S.', role:'Analista de RH · Belo Horizonte', text:'O alerta de vencimento de ASO salvou minha empresa de uma autuação. O sistema avisou 30 dias antes.' },
            ].map((t,i) => (
              <div key={i} className="testi-card reveal">
                <div className="testi-stars">★★★★★</div>
                <p>&ldquo;{t.text}&rdquo;</p>
                <div className="testi-author">
                  <div className="testi-avatar">{t.init}</div>
                  <div>
                    <div className="testi-name">{t.nome}</div>
                    <div className="testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BLOG ── */}
      <section className="blog-section">
        <div className="section-wrap section-center">
          <div className="section-label">Blog</div>
          <h2 className="section-h2">Notícias sobre <span className="grad">eSocial SST</span></h2>
          <p className="section-desc">Artigos e tutoriais para manter sua empresa em conformidade.</p>
          <div className="blog-grid">
            {[
              { tag:'Obrigatoriedade', title:'O que é o eSocial SST e quem é obrigado em 2025', resumo:'Quais empresas devem enviar os eventos SST, prazos e penalidades.', data:'02/06/2025', slug:'o-que-e-esocial-sst' },
              { tag:'Tutorial', title:'Como transmitir o S-2220 (ASO) ao eSocial: passo a passo', resumo:'Guia completo para médicos do trabalho enviarem o ASO corretamente.', data:'09/06/2025', slug:'como-transmitir-s2220-aso' },
              { tag:'Inteligência Artificial', title:'Como a IA lê PDFs de ASO e LTCAT para o eSocial', resumo:'Entenda o processo de extração automática de dados com IA.', data:'16/06/2025', slug:'ia-leitura-pdf-aso-ltcat' },
            ].map((a,i) => (
              <Link key={i} href={`/noticias/${a.slug}`} className="blog-card reveal">
                <div className="blog-card-top" />
                <div className="blog-card-body">
                  <span className="blog-tag">{a.tag}</span>
                  <h3>{a.title}</h3>
                  <p>{a.resumo}</p>
                </div>
                <div className="blog-card-foot">
                  <span>{a.data}</span>
                  <span className="blog-more">Ler →</span>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ marginTop:32 }}>
            <Link href="/noticias" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 24px', background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, fontWeight:600, color:'#185FA5', textDecoration:'none', transition:'border-color .15s,box-shadow .15s' }}>
              Ver todos os artigos →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CONTATO ── */}
      <section id="contato" className="contact-section">
        <div className="section-label" style={{ marginBottom:12 }}>Fale conosco</div>
        <h2 className="section-h2" style={{ marginBottom:8 }}>
          Estamos nas <span className="grad">redes sociais</span>
        </h2>
        <p style={{ fontSize:15, color:'#64748b', maxWidth:460, margin:'0 auto', lineHeight:1.75 }}>
          Tire dúvidas, peça suporte ou conheça mais sobre a Dseg Consultoria.
        </p>
        <div className="social-bar">
          <a href="tel:+5564992090277" className="social-btn s-phone">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            (64) 99209-0277
          </a>
          <a href="mailto:dseg.sst@gmail.com" className="social-btn s-email">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            dseg.sst@gmail.com
          </a>
          <a href="https://instagram.com/dseg.sst" target="_blank" rel="noopener noreferrer" className="social-btn s-ig">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            @dseg.sst
          </a>
          <a href="https://web.facebook.com/profile.php?id=61565545266445" target="_blank" rel="noopener noreferrer" className="social-btn s-fb">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
            Dseg Consultoria
          </a>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-blob"></div>
        <div className="cta-blob2"></div>
        <h2 className="cta-h2">
          Comece seu trial<br /><span className="grad">grátis hoje</span>
        </h2>
        <p className="cta-sub">
          14 dias para explorar todas as funcionalidades. Sem cartão de crédito, sem compromisso.
        </p>
        <div className="cta-btns">
          <Link href="/cadastro" className="btn-hero-main" style={{ justifyContent:'center' }}>Criar conta grátis</Link>
          <Link href="/login" style={{ padding:'15px 28px', background:'rgba(255,255,255,.08)', color:'#e2e8f0', border:'1.5px solid rgba(255,255,255,.15)', borderRadius:12, fontSize:15, fontWeight:600, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8 }}>
            Já tenho conta — entrar
          </Link>
        </div>
        <p className="cta-note">Suporte em até 24h · Dados hospedados no Brasil · LGPD</p>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="footer-inner">
          <div className="footer-top">
            <div>
              <div style={{ display:'flex', alignItems:'center' }}>
                <img src="/logo-branca.png" alt="DSEG Consultoria" style={{ height:72, width:'auto' }} />
              </div>
              <p className="footer-brand-desc">Plataforma SaaS para transmissão de eventos SST ao eSocial com inteligência artificial.</p>
            </div>
            <div className="footer-col">
              <h4>Produto</h4>
              <ul>
                <li><a href="#eventos">Eventos SST</a></li>
                <li><a href="#ia">IA &amp; Documentos</a></li>
                <li><a href="#funcionalidades">Funcionalidades</a></li>
                <li><a href="#precos">Preços</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Recursos</h4>
              <ul>
                <li><Link href="/noticias">Blog</Link></li>
                <li><Link href="/faq">FAQ</Link></li>
                <li><Link href="/login">Entrar</Link></li>
                <li><Link href="/cadastro">Criar conta</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Contato</h4>
              <ul>
                <li><a href="tel:+5564992090277">(64) 99209-0277</a></li>
                <li><a href="mailto:dseg.sst@gmail.com">dseg.sst@gmail.com</a></li>
                <li><a href="https://instagram.com/dseg.sst" target="_blank" rel="noopener noreferrer">@dseg.sst</a></li>
                <li><a href="https://web.facebook.com/profile.php?id=61565545266445" target="_blank" rel="noopener noreferrer">Facebook</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span suppressHydrationWarning>© {new Date().getFullYear()} eSocial SST — Dseg Consultoria. Todos os direitos reservados.</span>
            <span>Desenvolvido no Brasil 🇧🇷</span>
          </div>
        </div>
      </footer>
    </>
  )
}
