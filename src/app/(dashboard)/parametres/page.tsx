"use client";

import { useState } from "react";
import { Card, Input, Button, Select } from "@/components/ui";
import { useSession } from "next-auth/react";

export default function ParametresPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("profil");

  const tabs = [
    { id: "profil", label: "Profil & Compte", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" },
    { id: "entreprise", label: "Entreprise", icon: "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" },
    { id: "notifications", label: "Notifications", icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" },
    { id: "securite", label: "Sécurité", icon: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 page-enter pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
           <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-900/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                 <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
           </div>
           Paramètres du système
        </h1>
        <p className="text-sm font-medium text-slate-400 mt-2">
           Gérez vos préférences, la sécurité et les informations de l'entreprise.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
         {/* Sidebar Tabs */}
         <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-3xl p-3 border border-slate-100 shadow-sm space-y-1">
               {tabs.map((tab) => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                        activeTab === tab.id 
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                     }`}
                  >
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeTab === tab.id ? 2 : 1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                     </svg>
                     {tab.label}
                  </button>
               ))}
            </div>
         </div>

         {/* Content Area */}
         <div className="flex-1">
            {activeTab === "profil" && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="card-modern p-8">
                     <h2 className="text-lg font-black text-slate-800 mb-6">Informations personnelles</h2>
                     
                     <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-fleet-blue to-fleet-blue-dark flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-fleet-blue/20 border-4 border-white">
                           {session?.user?.name?.charAt(0)?.toUpperCase() || "A"}
                        </div>
                        <div>
                           <Button variant="secondary" className="mb-2">Changer la photo</Button>
                           <p className="text-xs text-slate-400 font-medium">Format recommandé: 256x256px JPG, PNG.</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Nom complet" defaultValue={session?.user?.name || "Administrateur"} />
                        <Input label="Adresse email" defaultValue={session?.user?.email || "admin@truckmanager.sn"} disabled />
                        <Input label="Téléphone" defaultValue="+221 77 123 45 67" />
                        <Select label="Rôle / Fonction" defaultValue="admin" options={[
                           { value: "admin", label: "Administrateur Système" },
                           { value: "manager", label: "Manager Logistique" }
                        ]} disabled />
                     </div>

                     <div className="mt-8 flex justify-end">
                        <Button className="bg-fleet-blue hover:bg-fleet-blue-dark border-none shadow-lg shadow-fleet-blue/30 text-white">Sauvegarder les modifications</Button>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === "entreprise" && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="card-modern p-8">
                     <h2 className="text-lg font-black text-slate-800 mb-6">Informations de l'entreprise</h2>
                     <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                        Ces informations seront utilisées sur les factures générées par le système et dans les rapports officiels.
                     </p>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Nom de l'entreprise" defaultValue="TRUCKMANAGER BTP" />
                        <Input label="NINEA / RCCM" defaultValue="0123456789" />
                        <Input label="Adresse principale" defaultValue="Zone Industrielle Rufisque, Dakar, Sénégal" />
                        <Input label="Email de contact" defaultValue="contact@truckmanager.sn" />
                        <Input label="Téléphone principal" defaultValue="+221 33 800 00 00" />
                        <Input label="Site Web" defaultValue="www.truckmanager.sn" />
                     </div>
                     <div className="mt-8 flex justify-end">
                        <Button className="bg-fleet-blue hover:bg-fleet-blue-dark border-none shadow-lg shadow-fleet-blue/30 text-white">Mettre à jour l'entreprise</Button>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === "notifications" && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="card-modern p-8">
                     <h2 className="text-lg font-black text-slate-800 mb-6">Préférences de notification</h2>
                     
                     <div className="space-y-4">
                        {[
                           { title: "Alertes Maintenance", desc: "Être prévenu lorsqu'un camion nécessite une révision ou un entretien.", checked: true },
                           { title: "Rapports Hebdomadaires", desc: "Recevoir un résumé par email de l'activité financière (ventes et charges).", checked: true },
                           { title: "Alertes Facturation", desc: "Notifications pour les factures impayées ou en retard.", checked: false },
                           { title: "Activité Système", desc: "Recevoir un email lors de la connexion d'un nouvel appareil au compte admin.", checked: true },
                        ].map((notif, idx) => (
                           <div key={idx} className="flex items-start justify-between p-4 rounded-2xl border border-slate-100 hover:border-fleet-blue/20 bg-slate-50/50 hover:bg-fleet-blue/5 transition-colors">
                              <div>
                                 <h3 className="text-sm font-bold text-slate-800">{notif.title}</h3>
                                 <p className="text-xs text-slate-500 mt-1">{notif.desc}</p>
                              </div>
                              {/* Toggle switch mockup */}
                              <div className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${notif.checked ? 'bg-fleet-blue' : 'bg-slate-300'}`}>
                                 <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${notif.checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
                              </div>
                           </div>
                        ))}
                     </div>
                     <div className="mt-8 flex justify-end">
                        <Button className="bg-fleet-blue hover:bg-fleet-blue-dark border-none shadow-lg shadow-fleet-blue/30 text-white">Sauvegarder les préférences</Button>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === "securite" && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="card-modern p-8">
                     <h2 className="text-lg font-black text-slate-800 mb-6">Changer le mot de passe</h2>
                     
                     <div className="space-y-4 max-w-md">
                        <Input label="Mot de passe actuel" type="password" />
                        <Input label="Nouveau mot de passe" type="password" />
                        <Input label="Confirmer le nouveau mot de passe" type="password" />
                     </div>
                     <div className="mt-8 flex justify-start">
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/20">Mettre à jour le mot de passe</Button>
                     </div>
                  </div>

                  <div className="card-modern p-8 border-rose-100">
                     <h2 className="text-lg font-black text-rose-600 mb-2">Zone de danger</h2>
                     <p className="text-sm text-slate-500 mb-6">Actions critiques liées à votre compte et vos données.</p>
                     
                     <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                        <div>
                           <h3 className="text-sm font-bold text-slate-800">Supprimer le compte</h3>
                           <p className="text-xs text-slate-500 mt-1">Cette action effacera toutes les données de manière irréversible.</p>
                        </div>
                        <button className="px-4 py-2 bg-rose-100 text-rose-600 hover:bg-rose-200 text-xs font-bold rounded-xl transition-colors whitespace-nowrap">
                           Supprimer définitivement
                        </button>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
