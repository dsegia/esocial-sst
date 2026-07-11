import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import { FAIXAS_VIDAS, formatarFaixaLabel } from '../lib/vidas-planos'

// ─── CSS ────────────────────────────────────────────────────────────────────
const globalCSS = `
*{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#0f172a;overflow-x:hidden;}

@keyframes float{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-18px) rotate(2deg)}}
@keyframes blob{0%,100%{border-radius:42% 58% 70% 30%/45% 45% 55% 55%}25%{border-radius:70% 30% 46% 54%/30% 60% 40% 70%}50%{border-radius:30% 70% 70% 30%/30% 30% 70% 70%}75%{border-radius:58% 42% 34% 66%/63% 37% 63% 37%}}
@keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.8)}}
@keyframes fade-up{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes slide-left{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
@keyframes spin-slow{to{transform:rotate(360deg)}}
@keyframes glow-pulse{0%,100%{box-shadow:0 0 0 0 rgba(24,95,165,.4)}50%{box-shadow:0 0 0 12px rgba(24,95,165,0)}}
@keyframes marquee-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes marquee-scroll-rev{from{transform:translateX(-50%)}to{transform:translateX(0)}}

/* ── PROGRESS RAIL ── */
.progress-rail{position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,#185FA5,#3b82f6,#6366f1);z-index:1001;transition:width .1s linear;box-shadow:0 0 8px rgba(59,130,246,.5);}

/* ── NAV ── */
nav{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(226,232,240,.8);transition:box-shadow .2s;}
nav.scrolled{box-shadow:0 4px 24px rgba(15,23,42,.08);}
.nav-inner{max-width:1180px;margin:0 auto;padding:0 24px;height:96px;display:flex;align-items:center;justify-content:space-between;}
.nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
.nav-logo-img{height:90px;width:auto;transition:height .2s;}
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
.hero{min-height:100vh;display:flex;align-items:center;padding:100px 24px 120px;background:#f8fafc;position:relative;overflow:hidden;}
.hero-blob1{position:absolute;width:520px;height:520px;background:radial-gradient(circle,rgba(24,95,165,.14) 0%,transparent 70%);top:-120px;right:-100px;animation:blob 12s ease-in-out infinite;pointer-events:none;}
.hero-blob2{position:absolute;width:400px;height:400px;background:radial-gradient(circle,rgba(59,130,246,.1) 0%,transparent 70%);bottom:-80px;left:-80px;animation:blob 15s ease-in-out infinite reverse;pointer-events:none;}
.hero-blob3{position:absolute;width:280px;height:280px;background:radial-gradient(circle,rgba(99,102,241,.08) 0%,transparent 70%);top:40%;left:40%;animation:blob 18s ease-in-out infinite .5s;pointer-events:none;}
.hero-dots{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(24,95,165,.08) 1px,transparent 1px);background-size:32px 32px;pointer-events:none;opacity:.6;}
.hero-edge{position:absolute;left:0;right:0;bottom:-1px;line-height:0;z-index:2;}
.hero-edge svg{display:block;width:100%;height:64px;}
.hero-inner{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:1.05fr .95fr;gap:72px;align-items:center;position:relative;z-index:1;}
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:#fff;color:#185FA5;border:1.5px solid rgba(24,95,165,.2);border-radius:99px;padding:6px 16px 6px 10px;font-size:12px;font-weight:700;margin-bottom:24px;box-shadow:0 2px 12px rgba(24,95,165,.1);animation:fade-up .6s ease both;}
.badge-dot{width:8px;height:8px;background:#22c55e;border-radius:50%;animation:pulse-dot 1.8s infinite;flex-shrink:0;}
.badge-dot-ring{width:14px;height:14px;border-radius:50%;background:rgba(34,197,94,.15);display:flex;align-items:center;justify-content:center;animation:glow-pulse 2.5s infinite;}
.hero h1{font-size:clamp(34px,4.6vw,58px);font-weight:900;line-height:1.08;letter-spacing:-1.5px;color:#0f172a;margin-bottom:22px;animation:fade-up .6s ease .1s both;}
.hero h1 .grad{background:linear-gradient(135deg,#185FA5 0%,#3b82f6 50%,#6366f1 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.hero-sub{font-size:clamp(15px,1.8vw,18px);color:#64748b;line-height:1.8;margin-bottom:36px;max-width:520px;animation:fade-up .6s ease .2s both;}
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
.hero-demo-scene{perspective:1200px;animation:slide-left .8s ease .2s both;}
.hero-demo-wrap{transform-style:preserve-3d;transition:transform .12s ease-out;will-change:transform;}

/* ── MARQUEE ── */
.marquee-strip{background:#fff;border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9;padding:18px 0;overflow:hidden;position:relative;z-index:1;}
.marquee-track{display:flex;gap:12px;width:max-content;animation:marquee-scroll 36s linear infinite;}
.marquee-strip:hover .marquee-track{animation-play-state:paused;}
.marquee-chip{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid #f1f5f9;border-radius:99px;padding:9px 16px;font-size:12.5px;font-weight:700;color:#475569;white-space:nowrap;flex-shrink:0;}
.marquee-chip b{color:#185FA5;}
.marquee-dot{width:5px;height:5px;border-radius:50%;background:#cbd5e1;}

/* ── STATS ── */
.stats-section{padding:64px 24px;background:#fff;}
.stats-inner{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:0;}
.stat-item{text-align:center;padding:24px 32px;position:relative;}
.stat-item:not(:last-child)::after{content:"";position:absolute;right:0;top:20%;height:60%;width:1px;background:#f1f5f9;}
.stat-num{font-size:44px;font-weight:900;background:linear-gradient(135deg,#185FA5,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-2px;line-height:1;}
.stat-label{font-size:13px;color:#64748b;margin-top:6px;font-weight:500;}

/* ── SECTION COMMON ── */
.section-wrap{max-width:1180px;margin:0 auto;padding:0 24px;}
.section-center{text-align:center;}
.section-label{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#185FA5;margin-bottom:14px;}
.section-label::before{content:"";width:24px;height:2px;background:linear-gradient(90deg,#185FA5,#3b82f6);border-radius:2px;}
.section-h2{font-size:clamp(26px,3.5vw,44px);font-weight:900;color:#0f172a;line-height:1.15;margin-bottom:14px;letter-spacing:-.5px;}
.section-h2 .grad{background:linear-gradient(135deg,#185FA5,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.section-desc{font-size:16px;color:#64748b;line-height:1.8;max-width:560px;margin:0 auto 40px;}

/* ── PIPELINE (jornada) ── */
.pipeline-section{background:#f8fafc;padding:96px 0;}
.pipeline-list{max-width:800px;margin:56px auto 0;}
.pipeline-node{display:flex;gap:26px;position:relative;padding-bottom:60px;}
.pipeline-node:last-child{padding-bottom:0;}
.pipeline-node:not(:last-child)::before{content:"";position:absolute;left:27px;top:64px;bottom:0;width:2px;background:linear-gradient(180deg,#185FA5,rgba(99,102,241,.15));}
.pipeline-badge{width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#185FA5,#3b82f6);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;flex-shrink:0;box-shadow:0 8px 24px rgba(24,95,165,.3);position:relative;z-index:2;}
.pipeline-content{flex:1;padding-top:6px;}
.pipeline-content h3{font-size:19px;font-weight:800;color:#0f172a;margin-bottom:8px;letter-spacing:-.2px;}
.pipeline-content p{font-size:14px;color:#64748b;line-height:1.75;max-width:580px;}
.pipeline-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;}
.pipeline-chip{display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid #e2e8f0;border-radius:9px;padding:7px 12px;font-size:12px;font-weight:700;color:#185FA5;transition:border-color .15s,box-shadow .15s;}
.pipeline-chip.link{cursor:pointer;}
.pipeline-chip.link:hover{border-color:#185FA5;box-shadow:0 4px 12px rgba(24,95,165,.12);}

/* ── DOCUMENTOS SST (bento) ── */
.docs-bg{background:#fff;padding:88px 0;}
.docs-grid{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-flow:dense;gap:14px;}
.doc-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:24px;transition:box-shadow .2s,transform .2s,border-color .2s;text-align:left;}
.doc-card:hover{box-shadow:0 12px 40px rgba(24,95,165,.1);transform:translateY(-4px);border-color:rgba(24,95,165,.2);}
.doc-nr{display:inline-block;padding:4px 10px;border-radius:8px;font-size:10px;font-weight:800;background:rgba(24,95,165,.1);color:#185FA5;margin-bottom:12px;letter-spacing:.3px;}
.doc-card h3{font-size:15px;font-weight:800;color:#0f172a;margin-bottom:6px;}
.doc-card p{font-size:12.5px;color:#64748b;line-height:1.65;}
.doc-card.highlight{grid-column:span 2;background:linear-gradient(135deg,#185FA5,#3b82f6);border-color:transparent;display:flex;flex-direction:column;justify-content:center;padding:32px;}
.doc-card.highlight .doc-nr{background:rgba(255,255,255,.18);color:#fff;}
.doc-card.highlight h3{color:#fff;font-size:19px;}
.doc-card.highlight p{color:rgba(255,255,255,.8);font-size:13.5px;max-width:360px;}

/* ── FUNCIONALIDADES (bento) ── */
.features-bg{background:#f8fafc;padding:88px 0;}
.feat-bento{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-flow:dense;gap:14px;text-align:left;}
.feat-tile{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:26px;transition:box-shadow .2s,transform .2s,border-color .2s;display:flex;flex-direction:column;}
.feat-tile:hover{box-shadow:0 12px 40px rgba(24,95,165,.1);transform:translateY(-4px);border-color:rgba(24,95,165,.2);}
.feat-tile h3{font-size:15px;font-weight:800;color:#0f172a;margin-bottom:8px;}
.feat-tile p{font-size:13px;color:#64748b;line-height:1.7;}
.feat-icon{width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;flex-shrink:0;}
.feat-tile.big{grid-column:span 2;grid-row:span 2;background:linear-gradient(135deg,#0f172a,#1e293b 60%,#0f2d52);border-color:transparent;justify-content:space-between;}
.feat-tile.big h3{color:#fff;font-size:18px;}
.feat-tile.big p{color:rgba(255,255,255,.62);}
.feat-tile.wide{grid-column:span 2;flex-direction:row;align-items:center;gap:22px;}
.feat-tile.wide h3{margin-bottom:6px;}
.feat-mini-stats{display:flex;gap:10px;margin-top:22px;}
.feat-mini-stat{background:rgba(255,255,255,.08);border-radius:10px;padding:10px 14px;flex:1;}
.feat-mini-stat b{display:block;font-size:18px;font-weight:900;color:#fff;}
.feat-mini-stat span{display:block;font-size:10px;color:rgba(255,255,255,.55);margin-top:2px;}

/* ── PRICING ── */
.pricing-bg{background:#fff;padding:88px 0;}
.pricing-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;max-width:940px;margin:0 auto;}
.price-card{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:18px;padding:32px;position:relative;transition:box-shadow .2s,transform .2s;}
.price-card:hover{transform:translateY(-4px);}
.price-card.featured{background:#fff;border-color:#185FA5;box-shadow:0 0 0 4px rgba(24,95,165,.08),0 12px 40px rgba(24,95,165,.15);}
.price-pill{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#185FA5,#3b82f6);color:#fff;font-size:11px;font-weight:700;padding:4px 18px;border-radius:99px;white-space:nowrap;box-shadow:0 4px 12px rgba(24,95,165,.3);}
.price-index{font-size:11px;font-weight:900;color:#cbd5e1;margin-bottom:6px;letter-spacing:1px;}
.price-plan{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;margin-bottom:10px;}
.price-desc{font-size:13px;color:#64748b;margin-bottom:24px;line-height:1.6;}
.price-list{list-style:none;display:flex;flex-direction:column;gap:10px;margin-bottom:28px;}
.price-list li{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:#475569;}
.chk{color:#16a34a;font-weight:800;flex-shrink:0;font-size:14px;}
.price-btn{width:100%;padding:14px;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;text-decoration:none;display:block;text-align:center;transition:transform .15s,box-shadow .15s;border:none;font-family:inherit;}
.price-btn-main{background:linear-gradient(135deg,#185FA5,#3b82f6);color:#fff;border:none;box-shadow:0 4px 16px rgba(24,95,165,.25);}
.price-btn-main:hover{transform:translateY(-1px);box-shadow:0 8px 28px rgba(24,95,165,.35);}
.price-btn-ghost{background:transparent;color:#185FA5;border:1.5px solid rgba(24,95,165,.25);}
.price-btn-ghost:hover{border-color:#185FA5;background:rgba(24,95,165,.04);}

/* ── PROPOSAL MODAL ── */
.modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(2px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;animation:fade-up .2s ease both;}
.modal-box{background:#fff;border-radius:18px;max-width:460px;width:100%;max-height:90vh;overflow-y:auto;padding:32px;position:relative;box-shadow:0 24px 80px rgba(15,23,42,.3);}
.modal-close{position:absolute;top:16px;right:16px;background:#f1f5f9;border:none;border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#64748b;}
.modal-close:hover{background:#e2e8f0;}
.modal-field{margin-bottom:14px;text-align:left;}
.modal-field label{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:5px;}
.modal-field input,.modal-field select,.modal-field textarea{width:100%;padding:10px 12px;border:1.5px solid #e2e8f0;border-radius:9px;font-size:13px;font-family:inherit;color:#0f172a;transition:border-color .15s;}
.modal-field input:focus,.modal-field select:focus,.modal-field textarea:focus{outline:none;border-color:#185FA5;}
.modal-field textarea{resize:vertical;min-height:70px;}

/* ── TESTIMONIALS (marquee) ── */
.testi-section{background:#f8fafc;padding:88px 0;}
.testi-marquee{overflow:hidden;position:relative;}
.testi-marquee::before,.testi-marquee::after{content:"";position:absolute;top:0;bottom:0;width:100px;z-index:2;pointer-events:none;}
.testi-marquee::before{left:0;background:linear-gradient(90deg,#f8fafc,transparent);}
.testi-marquee::after{right:0;background:linear-gradient(270deg,#f8fafc,transparent);}
.testi-track{display:flex;gap:16px;width:max-content;animation:marquee-scroll-rev 46s linear infinite;}
.testi-marquee:hover .testi-track{animation-play-state:paused;}
.testi-card{width:320px;flex-shrink:0;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:26px;text-align:left;}
.testi-stars{color:#f59e0b;font-size:14px;margin-bottom:12px;letter-spacing:1px;}
.testi-card p{font-size:13.5px;color:#475569;line-height:1.8;margin-bottom:18px;font-style:italic;}
.testi-author{display:flex;align-items:center;gap:12px;}
.testi-avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#185FA5,#3b82f6);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;}
.testi-name{font-size:13px;font-weight:700;color:#0f172a;}
.testi-role{font-size:11px;color:#94a3b8;margin-top:2px;}

/* ── DEMO PANEL (usado no hero) ── */
@keyframes check-in{from{transform:scale(0) rotate(-45deg);opacity:0}to{transform:scale(1) rotate(0deg);opacity:1}}
@keyframes field-appear{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
@keyframes send-pulse{0%{box-shadow:0 0 0 0 rgba(22,163,74,.5)}70%{box-shadow:0 0 0 14px rgba(22,163,74,0)}100%{box-shadow:0 0 0 0 rgba(22,163,74,0)}}
@keyframes slide-up-fade{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.demo-panel{background:#fff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;box-shadow:0 24px 80px rgba(15,23,42,.14),0 4px 24px rgba(15,23,42,.06);position:relative;}
.demo-panel-bar{background:#f8fafc;padding:10px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #f1f5f9;}
.demo-panel-body{padding:20px;min-height:360px;display:flex;flex-direction:column;gap:12px;}
.demo-step-tabs{display:flex;gap:4px;margin-bottom:4px;}
.demo-tab{flex:1;padding:6px 4px;border-radius:8px;font-size:10px;font-weight:700;text-align:center;transition:background .3s,color .3s;color:#94a3b8;background:transparent;border:none;cursor:default;}
.demo-tab.active{background:linear-gradient(135deg,#185FA5,#3b82f6);color:#fff;}
.demo-tab.done{background:rgba(22,163,74,.1);color:#16a34a;}
.demo-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;box-shadow:0 2px 8px rgba(15,23,42,.04);}
.demo-card-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#185FA5;margin-bottom:10px;display:flex;align-items:center;gap:6px;}
.demo-field{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#94a3b8;padding:4px 0;border-bottom:1px solid #f1f5f9;}
.demo-field:last-child{border:none;}
.demo-field-val{color:#0f172a;font-weight:600;font-size:11px;}
.demo-progress-wrap{background:#f1f5f9;border-radius:99px;height:6px;overflow:hidden;margin:6px 0;}
.demo-progress-bar{height:100%;border-radius:99px;background:linear-gradient(90deg,#185FA5,#3b82f6);}
.demo-upload-zone{border:2px dashed #e2e8f0;border-radius:12px;padding:24px;text-align:center;transition:border-color .3s,background .3s;}
.demo-upload-zone.active{border-color:#185FA5;background:rgba(24,95,165,.04);}
.demo-success-bar{display:flex;align-items:center;gap:10px;background:rgba(22,163,74,.06);border:1px solid rgba(22,163,74,.2);border-radius:10px;padding:12px 14px;font-size:12px;color:#16a34a;font-weight:600;}
.demo-restart-btn{width:100%;padding:10px;border:1.5px solid rgba(24,95,165,.2);background:transparent;border-radius:10px;font-size:12px;font-weight:600;color:#185FA5;cursor:pointer;transition:background .15s,border-color .15s;margin-top:4px;}
.demo-restart-btn:hover{background:rgba(24,95,165,.05);border-color:#185FA5;}

/* ── BLOG STRIP ── */
.blog-section{background:#fff;padding:80px 0;}
.blog-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;}
.blog-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;text-decoration:none;color:inherit;transition:box-shadow .2s,transform .2s,border-color .2s;display:flex;flex-direction:column;}
.blog-card:hover{box-shadow:0 10px 36px rgba(24,95,165,.1);transform:translateY(-4px);border-color:rgba(24,95,165,.2);}
.blog-card-top{height:6px;background:linear-gradient(90deg,#185FA5,#3b82f6);}
.blog-card-body{padding:22px;flex:1;}
.blog-tag{display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#185FA5;background:rgba(24,95,165,.08);padding:3px 10px;border-radius:99px;margin-bottom:12px;}
.blog-card h3{font-size:15px;font-weight:800;color:#0f172a;line-height:1.4;margin-bottom:8px;}
.blog-card p{font-size:12px;color:#64748b;line-height:1.7;}
.blog-card-foot{padding:14px 22px;border-top:1px solid #f1f5f9;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between;}
.blog-more{font-size:12px;font-weight:600;color:#185FA5;}

/* ── CONTACT ── */
.contact-section{background:#f8fafc;padding:72px 24px;text-align:center;border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9;}
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
  .hero-demo-scene{max-width:480px;margin:0 auto;}
  .hero-sub{margin:0 auto 32px;}
  .hero-btns{justify-content:center;}
  .hero-note,.hero-trust{justify-content:center;}
  .stats-inner{grid-template-columns:1fr 1fr;}
  .stat-item:not(:last-child)::after{display:none;}
  .stat-item:nth-child(1),.stat-item:nth-child(2){border-bottom:1px solid #f1f5f9;}
  .stat-item:nth-child(1),.stat-item:nth-child(3){border-right:1px solid #f1f5f9;}
  .docs-grid{grid-template-columns:repeat(2,1fr);}
  .feat-bento{grid-template-columns:repeat(2,1fr);}
  .feat-tile.big{grid-column:span 2;grid-row:span 1;}
}
@media(max-width:640px){
  .nav-links,.nav-cta{display:none;}
  .nav-mobile-btn{display:flex;}
  .nav-inner{padding:0 16px;height:64px;}
  .nav-logo-img{height:44px;}
  .hero{padding:80px 16px 90px;}
  .hero h1{font-size:32px;letter-spacing:-.5px;}
  .hero-btns{flex-direction:column;align-items:stretch;}
  .btn-hero-main,.btn-hero-sec{justify-content:center;text-align:center;}
  .section-wrap{padding:0 16px;}
  .blog-grid,.pricing-grid{grid-template-columns:1fr;}
  .pipeline-node{gap:16px;}
  .pipeline-badge{width:44px;height:44px;font-size:16px;border-radius:12px;}
  .pipeline-node:not(:last-child)::before{left:21px;top:50px;}
  .docs-grid{grid-template-columns:1fr;}
  .doc-card.highlight{grid-column:span 1;}
  .feat-bento{grid-template-columns:1fr;}
  .feat-tile.big,.feat-tile.wide{grid-column:span 1;grid-row:span 1;flex-direction:column;align-items:flex-start;}
  .testi-card{width:280px;}
  .social-bar{flex-direction:column;align-items:stretch;}
  .social-btn{justify-content:center;}
  .cta-btns{flex-direction:column;align-items:stretch;}
  .cta-btns a{justify-content:center;}
  .footer-top{flex-direction:column;gap:28px;}
  .footer-bottom{flex-direction:column;align-items:center;text-align:center;}
  .stat-num{font-size:34px;}
}
`

// ─── DADOS ───────────────────────────────────────────────────────────────────
const DOCUMENTOS_SST = [
  { nr:'NR-1',            nome:'PGR',   desc:'Programa de Gerenciamento de Riscos — inventário de riscos e plano de ação por função, documento-mestre que alimenta os demais.' },
  { nr:'NR-9 / S-2240',   nome:'LTCAT', desc:'Laudo Técnico das Condições Ambientais — GHEs, agentes nocivos e aposentadoria especial.' },
  { nr:'NR-7',            nome:'PCMSO', desc:'Programa de Controle Médico — exames por função e periodicidade, com médico coordenador.' },
  { nr:'NR-17',           nome:'AET',   desc:'Análise Ergonômica do Trabalho — postos de trabalho e fatores ergonômicos por função.' },
  { nr:'Gestão de risco', nome:'APR',   desc:'Análise Preliminar de Risco por atividade/tarefa, com classificação de probabilidade x severidade.' },
  { nr:'NR-15 / NR-16',   nome:'LIP',   desc:'Laudo de Insalubridade e Periculosidade — grau de enquadramento por função.' },
  { nr:'Previdenciário',  nome:'PPP',   desc:'Perfil Profissiográfico Previdenciário — histórico de exposição por funcionário, herdado do LTCAT vigente.' },
]

const MARQUEE_ITEMS = [
  { k:'PGR', l:'NR-1' },
  { k:'LTCAT', l:'NR-9' },
  { k:'PCMSO', l:'NR-7' },
  { k:'AET', l:'NR-17' },
  { k:'APR', l:'Risco' },
  { k:'LIP', l:'NR-15/16' },
  { k:'PPP', l:'Previdência' },
  { k:'S-2210', l:'CAT' },
  { k:'S-2220', l:'ASO' },
  { k:'S-2221', l:'Toxicológico' },
  { k:'S-2240', l:'Condições Ambientais' },
]

const PIPELINE = [
  {
    n:'1', title:'Cadastre a empresa e os funcionários',
    desc:'Poucos minutos: dados da empresa e funcionários (CPF, função, CBO automático) — a base que alimenta os 7 documentos SST e os eventos eSocial.',
    chips:['Empresa','Funcionários','CBO automático','Planilha CSV'],
  },
  {
    n:'2', title:'Ou importe um PDF que já existe — a IA lê por você', id:'ia',
    desc:'Já tem um ASO, LTCAT ou PCMSO pronto? Solte o PDF e Claude/Gemini extraem cada campo automaticamente, sem digitar XML na mão.',
    chips:['ASO','LTCAT','PCMSO','Claude (Anthropic)','Gemini'],
  },
  {
    n:'3', title:'Os 7 documentos SST nascem dos mesmos dados', id:'jornada-docs',
    desc:'PGR, LTCAT, PCMSO, AET, APR, LIP e PPP são gerados e mantidos a partir de uma única fonte de verdade — atualize o LTCAT e os demais acompanham.',
    chips:[...DOCUMENTOS_SST.map(d => d.nome), 'Ver os 7 documentos'],
    linkLastChip:'#documentos',
  },
  {
    n:'4', title:'Quando precisar, transmita ao eSocial', id:'eventos',
    desc:'Certificado A1 armazenado com criptografia AES-256. Os eventos SST são assinados e enviados ao Gov.br automaticamente, com recibo salvo no histórico.',
    chips:['S-2210 · CAT','S-2220 · ASO','S-2221 · Toxicológico','S-2240 · Cond. Ambientais'],
  },
  {
    n:'5', title:'Conformidade monitorada todo mês',
    desc:'Dashboard executivo, relatório de conformidade em % e alertas de vencimento por e-mail mantêm sua empresa longe de autuações.',
    chips:['Dashboard executivo','Relatório de conformidade','Alertas por e-mail'],
  },
]

const REST_FEATURES = [
  { bg:'rgba(24,95,165,.1)', ic:'#185FA5', title:'Fila de Transmissão', desc:'Eventos pendentes e rejeitados agrupados por tipo, com idade de cada pendência e envio em lote.',
    svg:<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></> },
  { bg:'rgba(217,119,6,.1)', ic:'#d97706', title:'Alertas configuráveis', desc:'E-mail automático de 7 a 90 dias antes do vencimento de ASO e LTCAT, com preview antes de disparar.',
    svg:<><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></> },
  { bg:'rgba(239,68,68,.1)', ic:'#dc2626', title:'Importação em massa', desc:'Cadastre dezenas de funcionários de uma vez via planilha, com validação de CPF e busca automática de CBO.',
    svg:<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></> },
  { bg:'rgba(99,102,241,.1)', ic:'#6366f1', title:'Multi-empresa + procuração eCAC', desc:'Gerencie múltiplos CNPJs com um login. Escritórios de SST transmitem por seus clientes via procuração eCAC.',
    svg:<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></> },
  { bg:'rgba(20,184,166,.1)', ic:'#0d9488', title:'Certificado digital criptografado', desc:'Upload de certificado A1 com leitura automática de validade e armazenamento AES-256.',
    svg:<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> },
  { bg:'rgba(139,92,246,.1)', ic:'#7c3aed', title:'Perfis de usuário', desc:'Admin, Operador ou Visualizador — convide sua equipe com o nível de acesso certo.',
    svg:<><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><polyline points="16,4 18,6 22,2"/></> },
  { bg:'rgba(22,163,74,.1)', ic:'#16a34a', title:'Onboarding guiado', desc:'Checklist de primeiros passos: empresa, certificado, funcionários e primeira transmissão.',
    svg:<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></> },
]

const TESTIMONIALS = [
  { init:'MC', nome:'Márcia C.', role:'Médica do Trabalho · São Paulo', text:'Antes gastava horas preenchendo XML. Agora importo o PDF do ASO e em segundos está pronto para transmitir. Incrível.' },
  { init:'RF', nome:'Ricardo F.', role:'Engenheiro de Segurança · Curitiba', text:'Gerencio 12 empresas aqui. O multi-empresa é perfeito — cada uma isolada mas acesso tudo com um login só.' },
  { init:'PS', nome:'Patricia S.', role:'Analista de RH · Belo Horizonte', text:'O alerta de vencimento de ASO salvou minha empresa de uma autuação. O sistema avisou 30 dias antes.' },
  { init:'JB', nome:'João B.', role:'Consultor SST · Goiânia', text:'A procuração eCAC mudou como atendo meus clientes — transmito por todos eles sem sair de uma tela só.' },
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
type DocType = 'aso' | 'ltcat' | 'pcmso'

const DOCS: Record<DocType, {
  label: string; file: string; size: string; evento: string; eventoLabel: string
  aiChecks: string[]; fields: { label: string; value: string; green?: boolean }[]
  successMsg: string; successSub: string
}> = {
  aso: {
    label:'ASO', file:'ASO_joao_silva.pdf', size:'248 KB',
    evento:'S-2220', eventoLabel:'S-2220 · ASO Admissional',
    aiChecks:['Identificando tipo de exame...','Extraindo dados do trabalhador...','Localizando CRM e médico responsável...','Verificando resultado e aptidão...'],
    fields:[
      { label:'Funcionário', value:'João Silva Santos' },
      { label:'CPF', value:'123.456.789-00' },
      { label:'Tipo', value:'ASO Admissional' },
      { label:'Médico', value:'Dr. Roberto Lima' },
      { label:'CRM', value:'SP-42891' },
      { label:'Data do exame', value:'04/06/2026' },
      { label:'Resultado', value:'Apto', green:true },
    ],
    successMsg:'S-2220 transmitido com sucesso!',
    successSub:'Recibo: 1-2b3c4d5e · ASO salvo no histórico',
  },
  ltcat: {
    label:'LTCAT', file:'LTCAT_industria_abc.pdf', size:'1.2 MB',
    evento:'S-2240', eventoLabel:'S-2240 · Condições Ambientais',
    aiChecks:['Identificando agentes nocivos...','Extraindo dados da empresa e função...','Localizando EPIs e EPCs declarados...','Verificando intensidade de exposição...'],
    fields:[
      { label:'Empresa', value:'Indústria ABC Ltda' },
      { label:'CNPJ', value:'12.345.678/0001-90' },
      { label:'Função', value:'Operador de Máquinas' },
      { label:'Agente nocivo', value:'Ruído — 87 dB(A)' },
      { label:'EPI fornecido', value:'Protetor auricular CA-1234' },
      { label:'Responsável', value:'Eng. Carlos Souza' },
      { label:'Aposentadoria esp.', value:'Sim — 25 anos', green:true },
    ],
    successMsg:'S-2240 transmitido com sucesso!',
    successSub:'Recibo: 5-6f7g8h9i · LTCAT vinculado ao cargo',
  },
  pcmso: {
    label:'PCMSO', file:'PCMSO_2026_clinica.pdf', size:'876 KB',
    evento:'S-2220', eventoLabel:'S-2220 · Exame Periódico',
    aiChecks:['Identificando programa e vigência...','Extraindo responsável técnico e CRM...','Localizando exames complementares previstos...','Verificando periodicidade por função...'],
    fields:[
      { label:'Empresa', value:'Clínica Saúde Total' },
      { label:'Vigência', value:'01/01/2026 – 31/12/2026' },
      { label:'Médico coord.', value:'Dra. Ana Ferreira' },
      { label:'CRM', value:'MG-98765' },
      { label:'Exames previstos', value:'Hemograma, Audiometria' },
      { label:'Periodicidade', value:'Anual' },
      { label:'Status', value:'Aprovado pelo SESMT', green:true },
    ],
    successMsg:'S-2220 (PCMSO) transmitido!',
    successSub:'Recibo: 9-k1l2m3n4 · Programa registrado',
  },
}

function LiveDemo() {
  const [docType, setDocType] = useState<DocType>('aso')
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [visibleFields, setVisibleFields] = useState(0)
  const [txProgress, setTxProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clear() { if (timerRef.current) clearTimeout(timerRef.current) }
  function delay(ms: number) { return new Promise<void>(r => { timerRef.current = setTimeout(r, ms) }) }

  async function runDemo() {
    clear()
    const doc = DOCS[docType]
    setStep(1); setProgress(0); setVisibleFields(0); setTxProgress(0)
    for (let p = 0; p <= 100; p += 5) { await delay(55); setProgress(p) }
    await delay(250)
    setStep(2); setProgress(0)
    for (let p = 0; p <= 100; p += 3) { await delay(45); setProgress(p) }
    await delay(200)
    setStep(3)
    for (let i = 1; i <= doc.fields.length; i++) { await delay(200); setVisibleFields(i) }
    await delay(700)
    setStep(4); setTxProgress(0)
    for (let p = 0; p <= 100; p += 4) { await delay(50); setTxProgress(p) }
    await delay(300)
    setStep(5)
  }

  function reset() { clear(); setStep(0); setProgress(0); setVisibleFields(0); setTxProgress(0) }

  const doc = DOCS[docType]
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
        {/* tabs de progresso */}
        <div className="demo-step-tabs">
          {tabs.map((t, i) => (
            <div key={t} className={`demo-tab${activeTab === i ? ' active' : activeTab > i ? ' done' : ''}`}>
              {activeTab > i ? '✓' : t}
            </div>
          ))}
        </div>

        {/* IDLE — seletor de documento */}
        {step === 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:8, animation:'slide-up-fade .3s ease' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'1px', marginBottom:2 }}>
              Escolha o documento:
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {(['aso','ltcat','pcmso'] as DocType[]).map(t => (
                <button
                  key={t}
                  onClick={() => { if (step === 0) setDocType(t) }}
                  style={{
                    flex:1, padding:'8px 4px', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer',
                    border: docType === t ? 'none' : '1.5px solid #e2e8f0',
                    background: docType === t ? 'linear-gradient(135deg,#185FA5,#3b82f6)' : '#fff',
                    color: docType === t ? '#fff' : '#64748b',
                    boxShadow: docType === t ? '0 3px 12px rgba(24,95,165,.25)' : 'none',
                    transition:'all .15s',
                  }}
                >
                  {DOCS[t].label}
                </button>
              ))}
            </div>
            <div className="demo-upload-zone active" style={{ marginTop:2 }}>
              <div style={{ fontSize:26, marginBottom:8 }}>📄</div>
              <div style={{ fontSize:12, fontWeight:700, color:'#0f172a', marginBottom:3 }}>{doc.file}</div>
              <div style={{ fontSize:10, color:'#94a3b8', marginBottom:14 }}>{doc.size} · PDF · {doc.label}</div>
              <button
                onClick={runDemo}
                style={{ padding:'9px 22px', background:'linear-gradient(135deg,#185FA5,#3b82f6)', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(24,95,165,.3)' }}
              >
                ▶ Iniciar demonstração
              </button>
            </div>
          </div>
        )}

        {/* STEP 1 — upload */}
        {step === 1 && (
          <div className="demo-card" style={{ animation:'slide-up-fade .3s ease' }}>
            <div className="demo-card-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
              Recebendo arquivo...
            </div>
            <div className="demo-field"><span>Arquivo</span><span className="demo-field-val">{doc.file}</span></div>
            <div className="demo-field"><span>Tamanho</span><span className="demo-field-val">{doc.size}</span></div>
            <div className="demo-field"><span>Tipo detectado</span><span className="demo-field-val" style={{ color:'#185FA5' }}>PDF · {doc.label}</span></div>
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
              Claude IA processando {doc.label}...
            </div>
            <div style={{ fontSize:11, color:'#64748b', marginBottom:10 }}>Lendo documento e extraindo dados...</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {doc.aiChecks.map((msg, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color: progress > i*25 ? '#16a34a' : '#94a3b8', transition:'color .3s' }}>
                  <span style={{ fontSize:10 }}>{progress > i*25 ? '✓' : '○'}</span>{msg}
                </div>
              ))}
            </div>
            <div style={{ marginTop:10 }}>
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
              Dados extraídos — {doc.label}
            </div>
            {doc.fields.slice(0, visibleFields).map((f, i) => (
              <div key={i} className="demo-field" style={{ animation:'field-appear .25s ease' }}>
                <span>{f.label}</span>
                <span className="demo-field-val" style={f.green ? { color:'#16a34a' } : {}}>{f.value}</span>
              </div>
            ))}
            {visibleFields < doc.fields.length && (
              <div style={{ height:18, display:'flex', alignItems:'center', gap:4, marginTop:4 }}>
                {[0,.2,.4].map(d => (
                  <span key={d} style={{ width:6, height:6, borderRadius:'50%', background:'#185FA5', animation:`pulse-dot .8s infinite ${d}s`, display:'inline-block' }} />
                ))}
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
            <div className="demo-field"><span>Evento</span><span className="demo-field-val">{doc.eventoLabel}</span></div>
            <div className="demo-field"><span>Ambiente</span><span className="demo-field-val">Produção</span></div>
            <div className="demo-field"><span>Assinatura digital</span><span className="demo-field-val" style={{ color:'#16a34a' }}>ICP-Brasil ✓</span></div>
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
                <div style={{ fontWeight:700 }}>{doc.successMsg}</div>
                <div style={{ fontSize:10, color:'#4ade80', fontWeight:400, marginTop:1 }}>{doc.successSub}</div>
              </div>
            </div>
            <div className="demo-card" style={{ padding:'10px 14px' }}>
              <div style={{ fontSize:10, color:'#94a3b8', marginBottom:6, fontWeight:700, textTransform:'uppercase', letterSpacing:'1px' }}>Resumo</div>
              {[
                { l:'Documento', v:doc.label },
                { l:'Evento', v:doc.eventoLabel },
                { l:'Status eSocial', v:'Processado com sucesso', c:'#16a34a' },
                { l:'XML salvo', v:'✓ Disponível para download' },
              ].map((f,i) => (
                <div key={i} className="demo-field">
                  <span>{f.l}</span>
                  <span className="demo-field-val" style={f.c ? { color:f.c } : {}}>{f.v}</span>
                </div>
              ))}
            </div>
            <button className="demo-restart-btn" onClick={reset}>↺ Testar outro documento</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── FORMULÁRIO DE PROPOSTA ──────────────────────────────────────────────────
type LeadForm = { nome: string; empresa: string; email: string; telefone: string; funcionarios: string; mensagem: string }

function ProposalModal({ plano, onClose }: { plano: string; onClose: () => void }) {
  const [form, setForm] = useState<LeadForm>({ nome:'', empresa:'', email:'', telefone:'', funcionarios:'', mensagem:'' })
  const [status, setStatus] = useState<'idle'|'enviando'|'ok'|'erro'>('idle')
  const [erro, setErro] = useState('')

  function set(field: keyof LeadForm, value: string) { setForm(f => ({ ...f, [field]: value })) }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setStatus('enviando'); setErro('')
    try {
      const resp = await fetch('/api/leads/proposta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plano_interesse: plano }),
      })
      const json = await resp.json()
      if (!resp.ok) throw new Error(json.erro || 'Erro ao enviar solicitação')
      setStatus('ok')
    } catch (err: any) {
      setStatus('erro'); setErro(err.message)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {status === 'ok' ? (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(22,163,74,.1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
            </div>
            <h3 style={{ fontSize:17, fontWeight:800, color:'#0f172a', marginBottom:8 }}>Solicitação enviada!</h3>
            <p style={{ fontSize:13, color:'#64748b', lineHeight:1.7 }}>
              Recebemos seus dados. Em breve entramos em contato com uma proposta personalizada{form.empresa ? ` para ${form.empresa}` : ''}.
            </p>
          </div>
        ) : (
          <>
            <div style={{ fontSize:11, fontWeight:700, color:'#185FA5', textTransform:'uppercase', letterSpacing:'1px', marginBottom:4 }}>
              Plano {plano}
            </div>
            <h3 style={{ fontSize:19, fontWeight:800, color:'#0f172a', marginBottom:6 }}>Solicitar proposta</h3>
            <p style={{ fontSize:13, color:'#64748b', marginBottom:20, lineHeight:1.6 }}>
              Preencha seus dados e retornamos com uma proposta sob medida para o tamanho da sua operação.
            </p>
            <form onSubmit={enviar}>
              <div className="modal-field">
                <label>Nome *</label>
                <input required value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Seu nome" />
              </div>
              <div className="modal-field">
                <label>Empresa</label>
                <input value={form.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Nome da empresa" />
              </div>
              <div className="modal-field">
                <label>E-mail *</label>
                <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="voce@empresa.com" />
              </div>
              <div className="modal-field">
                <label>Telefone / WhatsApp</label>
                <input value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(00) 00000-0000" />
              </div>
              <div className="modal-field">
                <label>Nº de funcionários</label>
                <select value={form.funcionarios} onChange={e => set('funcionarios', e.target.value)}>
                  <option value="">Selecione...</option>
                  <option value="1-20">1 a 20</option>
                  <option value="21-50">21 a 50</option>
                  <option value="51-200">51 a 200</option>
                  <option value="200+">Mais de 200</option>
                </select>
              </div>
              <div className="modal-field">
                <label>Mensagem (opcional)</label>
                <textarea value={form.mensagem} onChange={e => set('mensagem', e.target.value)} placeholder="Conte um pouco sobre sua necessidade..." />
              </div>
              {status === 'erro' && (
                <div style={{ background:'#FCEBEB', color:'#791F1F', borderRadius:8, padding:'8px 12px', fontSize:12, marginBottom:14 }}>{erro}</div>
              )}
              <button type="submit" disabled={status === 'enviando'} className="price-btn price-btn-main" style={{ opacity: status === 'enviando' ? .6 : 1, cursor: status === 'enviando' ? 'not-allowed' : 'pointer' }}>
                {status === 'enviando' ? 'Enviando...' : 'Enviar solicitação'}
              </button>
            </form>
            <p style={{ fontSize:11, color:'#94a3b8', textAlign:'center', marginTop:14 }}>
              Prefere falar direto? <a href="tel:+5564992090277" style={{ color:'#185FA5', fontWeight:600 }}>(64) 99209-0277</a> ou <a href="mailto:dseg.sst@gmail.com" style={{ color:'#185FA5', fontWeight:600 }}>dseg.sst@gmail.com</a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [scrollPct, setScrollPct] = useState(0)
  const [modalPlano, setModalPlano] = useState<string | null>(null)
  const tiltRef = useTilt(6)
  useReveal()

  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 20)
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      setScrollPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0)
    }
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
      <Head>
        <title>eSocial SST — Documentos de SST e Transmissão com IA</title>
        <meta name="description" content="Emita os 7 documentos de SST exigidos por lei (PGR, LTCAT, PCMSO, AET, APR, LIP, PPP) e transmita os eventos do eSocial (S-2210, S-2220, S-2221, S-2240) — com leitura de PDF por inteligência artificial." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="eSocial SST — Documentos de SST e Transmissão com IA" />
        <meta property="og:description" content="Emita os 7 documentos de SST exigidos pelas NRs e transmita os eventos ao eSocial, com leitura de PDF por IA." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.dsegconsultoria.com.br" />
        <meta property="og:image" content="https://www.dsegconsultoria.com.br/logo-completa.png" />
        <meta property="og:image:width" content="2000" />
        <meta property="og:image:height" content="2000" />
        <meta property="og:locale" content="pt_BR" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="eSocial SST — Documentos de SST e Transmissão com IA" />
        <meta name="twitter:description" content="Emita os 7 documentos de SST exigidos pelas NRs e transmita os eventos ao eSocial, com leitura de PDF por IA." />
        <meta name="twitter:image" content="https://www.dsegconsultoria.com.br/logo-completa.png" />
        <link rel="canonical" href="https://www.dsegconsultoria.com.br" />
        <meta name="keywords" content="pgr nr-1, ltcat nr-9, pcmso nr-7, aet nr-17, ppp previdenciario, documentos sst, esocial sst, transmissão esocial sst, s-2220 esocial, s-2240 esocial, s-2210 esocial, software esocial sst, aso esocial, certificado digital esocial, automatizar esocial sst" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'eSocial SST',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          url: 'https://www.dsegconsultoria.com.br',
          description: 'Software SaaS brasileiro que emite os 7 documentos de Saúde e Segurança do Trabalho exigidos pelas Normas Regulamentadoras (PGR, LTCAT, PCMSO, AET, APR, LIP, PPP) e transmite os eventos SST ao eSocial Gov.br, com leitura de PDF por inteligência artificial.',
          featureList: ['Documentos SST: PGR, LTCAT, PCMSO, AET, APR, LIP, PPP', 'Leitura de PDF com IA (ASO, LTCAT, PCMSO, CAT)', 'Transmissão S-2210, S-2220, S-2221, S-2240', 'Dashboard executivo e relatório de conformidade', 'Assinatura digital ICP-Brasil', 'Alertas de vencimento configuráveis', 'Multi-empresa e procuração eCAC', 'Trial 14 dias grátis'],
          aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '12' },
        }) }} />
        <style dangerouslySetInnerHTML={{ __html: globalCSS }} />
      </Head>

      <div className="progress-rail" style={{ width: `${scrollPct}%` }} />

      {/* ── NAV ── */}
      <nav className={scrolled ? 'scrolled' : ''}>
        <div className="nav-inner">
          <a href="#" className="nav-logo">
            <img src="/logo-completa.png" alt="DSEG Consultoria em SST" className="nav-logo-img" />
          </a>
          <div className="nav-links">
            <a href="#documentos">Documentos SST</a>
            <a href="#jornada">Como funciona</a>
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
            {[['#documentos','Documentos SST'],['#jornada','Como funciona'],['#funcionalidades','Funcionalidades'],['#precos','Preços'],['/noticias','Blog'],['#contato','Contato']].map(([href,label]) => (
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
              Sistema ao vivo · PGR, LTCAT, PCMSO e mais 4 documentos
            </div>
            <h1>
              Emita os <span className="grad">7 documentos de SST</span><br />
              com Inteligência Artificial
            </h1>
            <p className="hero-sub">
              PGR, LTCAT, PCMSO, AET, APR, LIP e PPP — gerados e mantidos em um só lugar. Importe um PDF existente e a IA extrai os dados, ou cadastre direto — e transmita ao eSocial (S-2210, S-2220, S-2221, S-2240) quando precisar.
            </p>
            <div className="hero-btns">
              <Link href="/cadastro" className="btn-hero-main">
                Começar trial grátis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>
              </Link>
              <a href="#documentos" className="btn-hero-sec">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16 10,8"/></svg>
                Ver os 7 documentos
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

          {/* Right — Demo Interativa com tilt 3D */}
          <div className="hero-demo-scene">
            <div className="hero-demo-wrap" ref={tiltRef}>
              <LiveDemo />
            </div>
          </div>
        </div>

        <div className="hero-edge">
          <svg viewBox="0 0 100 12" preserveAspectRatio="none">
            <polygon points="0,12 100,0 100,12" fill="#fff" />
          </svg>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="marquee-strip">
        <div className="marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((m,i) => (
            <div key={i} className="marquee-chip"><b>{m.k}</b><span className="marquee-dot" />{m.l}</div>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="stats-section">
        <div className="stats-inner">
          {[
            { target:7,   suffix:'',  label:'Documentos SST completos' },
            { target:4,   suffix:'',  label:'Eventos eSocial suportados' },
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

      {/* ── DOCUMENTOS SST ── */}
      <section id="documentos" className="docs-bg">
        <div className="section-wrap section-center">
          <div className="section-label">Documentos SST</div>
          <h2 className="section-h2">Os <span className="grad">7 documentos</span> que sua empresa precisa</h2>
          <p className="section-desc">
            Todo o conjunto de laudos e programas exigidos pelas Normas Regulamentadoras, gerados e mantidos em um só lugar — com dados que se propagam automaticamente do LTCAT vigente para os demais documentos.
          </p>
          <div className="docs-grid">
            {DOCUMENTOS_SST.map((d,i) => (
              <div key={i} className={`doc-card reveal${i === 0 ? ' highlight' : ''}`}>
                <div className="doc-nr">{d.nr}</div>
                <h3>{d.nome}</h3>
                <p>{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── JORNADA (pipeline) ── */}
      <section id="jornada" className="pipeline-section">
        <div className="section-wrap section-center" style={{ paddingBottom:0 }}>
          <div className="section-label">Como funciona</div>
          <h2 className="section-h2">De um cadastro só, <span className="grad">tudo o resto acontece</span></h2>
          <p className="section-desc">Os mesmos dados alimentam os 7 documentos SST e, quando precisar, a transmissão ao eSocial — sem digitar a mesma informação duas vezes.</p>

          <div className="pipeline-list" style={{ textAlign:'left' }}>
            {PIPELINE.map((node, i) => (
              <div key={i} id={node.id} className="pipeline-node reveal">
                <div className="pipeline-badge">{node.n}</div>
                <div className="pipeline-content">
                  <h3>{node.title}</h3>
                  <p>{node.desc}</p>
                  <div className="pipeline-chips">
                    {node.chips.map((c, j) => {
                      const isLast = j === node.chips.length - 1
                      if (isLast && node.linkLastChip) {
                        return <a key={j} href={node.linkLastChip} className="pipeline-chip link">{c}</a>
                      }
                      return <span key={j} className="pipeline-chip">{c}</span>
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNCIONALIDADES (bento) ── */}
      <section id="funcionalidades" className="features-bg">
        <div className="section-wrap section-center">
          <div className="section-label">Funcionalidades</div>
          <h2 className="section-h2">Tudo para <span className="grad">cumprir as NRs e o eSocial</span></h2>
          <p className="section-desc">Plataforma completa para médicos do trabalho, engenheiros de segurança e RH.</p>
          <div className="feat-bento">
            <div className="feat-tile big reveal">
              <div>
                <div className="feat-icon" style={{ background:'rgba(255,255,255,.1)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                </div>
                <h3>Dashboard executivo</h3>
                <p>Visão consolidada de tudo: funcionários com pendências, ASOs a vencer, transmissões pendentes e status dos 7 documentos — com alertas priorizados por criticidade.</p>
              </div>
              <div className="feat-mini-stats">
                {[['7','alertas'],['12','pendentes'],['98%','em dia']].map(([n,l],i) => (
                  <div key={i} className="feat-mini-stat"><b>{n}</b><span>{l}</span></div>
                ))}
              </div>
            </div>

            <div className="feat-tile wide reveal">
              <div style={{ flex:1 }}>
                <div className="feat-icon" style={{ background:'rgba(22,163,74,.1)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>
                </div>
                <h3>Relatório de Conformidade</h3>
                <p>Índice de conformidade de ASO por funcionário, com exportação em PDF pronta para auditoria.</p>
              </div>
              <div style={{ textAlign:'center', flexShrink:0, paddingRight:8 }}>
                <div style={{ fontSize:36, fontWeight:900, color:'#16a34a', letterSpacing:'-1px' }}>94%</div>
                <div style={{ fontSize:10, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.5px', marginTop:2 }}>conformidade</div>
              </div>
            </div>

            {REST_FEATURES.map((f,i) => (
              <div key={i} className="feat-tile reveal">
                <div className="feat-icon" style={{ background:f.bg }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={f.ic} strokeWidth="2">{f.svg}</svg>
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PREÇOS ── */}
      <section id="precos" className="pricing-bg">
        <div className="section-wrap section-center">
          <div className="section-label">Planos</div>
          <h2 className="section-h2">Um plano só, <span className="grad">por número de vidas</span></h2>
          <p className="section-desc">
            Sem escolha manual de pacote: a mensalidade escala com o número de funcionários ativos cadastrados. Os 7 documentos SST (PGR, LTCAT, PCMSO, AET, APR, LIP, PPP) e a transmissão eSocial inclusos e ilimitados em qualquer faixa.
          </p>
          <div className="pricing-grid">
            {[
              { idx: FAIXAS_VIDAS.findIndex(f => 'preco' in f && f.preco === 69), destaque: false, desc: 'Para empresas com poucos funcionários.' },
              { idx: FAIXAS_VIDAS.findIndex(f => 'preco' in f && f.preco === 179), destaque: true, desc: 'Para operações em crescimento com múltiplas empresas.' },
              { idx: FAIXAS_VIDAS.findIndex(f => 'preco' in f && f.preco === 399), destaque: false, desc: 'Para consultorias e empresas com maior volume de CNPJs.' },
            ].map(({ idx, destaque, desc }, i) => {
              const faixa = FAIXAS_VIDAS[idx]
              const preco = 'preco' in faixa ? faixa.preco : null
              const label = formatarFaixaLabel(idx)
              return (
                <div key={i} className={destaque ? 'price-card featured reveal' : 'price-card reveal'}>
                  {destaque && <div className="price-pill">Mais popular</div>}
                  <div className="price-index">0{i + 1}</div>
                  <div className="price-plan">{label} vidas</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: '6px 0 2px' }}>
                    R$ {preco}<span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>/mês</span>
                  </div>
                  <p className="price-desc" style={{ marginTop: 4 }}>{desc}</p>
                  <ul className="price-list" style={{ textAlign: 'left' }}>
                    {['Os 7 documentos SST ilimitados', 'Transmissão eSocial ilimitada (S-2210/2220/2221/2240)', 'Importação por IA (PDF)', 'Alertas de vencimento', 'Múltiplos CNPJs', 'Exportação de PDF'].map((item, j) => (
                      <li key={j}><span className="chk">✓</span>{item}</li>
                    ))}
                  </ul>
                  <button
                    className={destaque ? 'price-btn price-btn-main' : 'price-btn price-btn-ghost'}
                    onClick={() => setModalPlano(`${label} vidas (R$ ${preco}/mês)`)}
                  >
                    Solicitar proposta
                  </button>
                </div>
              )
            })}
          </div>
          <p style={{ textAlign:'center', marginTop:28, fontSize:12, color:'#94a3b8' }}>
            A faixa é recalculada automaticamente pelo pico de funcionários ativos no ciclo · Resposta em até 24h · Ou <Link href="/cadastro" style={{ color:'#185FA5', fontWeight:600 }}>comece um trial grátis de 14 dias</Link> enquanto isso
          </p>
        </div>
      </section>

      {modalPlano && <ProposalModal plano={modalPlano} onClose={() => setModalPlano(null)} />}

      {/* ── DEPOIMENTOS (marquee) ── */}
      <section className="testi-section">
        <div className="section-wrap section-center" style={{ paddingBottom:0 }}>
          <div className="section-label">Depoimentos</div>
          <h2 className="section-h2">Quem já usa o <span className="grad">eSocial SST</span></h2>
          <p className="section-desc">Profissionais de SST economizando horas por semana em todo o Brasil.</p>
        </div>
        <div className="testi-marquee">
          <div className="testi-track">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t,i) => (
              <div key={i} className="testi-card">
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
              <p className="footer-brand-desc">Plataforma SaaS que emite os documentos de SST e transmite os eventos ao eSocial, com inteligência artificial.</p>
            </div>
            <div className="footer-col">
              <h4>Produto</h4>
              <ul>
                <li><a href="#documentos">Documentos SST</a></li>
                <li><a href="#jornada">Como funciona</a></li>
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
