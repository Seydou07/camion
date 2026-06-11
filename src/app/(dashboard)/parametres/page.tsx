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
      <div className="flex flex-col md:flex-row gap-8">
         {/* Sidebar Tabs */}
         <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-3 border border-slate-100 dark:border-slate-800 shadow-sm space-y-1">
               {tabs.map((tab) => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                        activeTab === tab.id 
                        ? "bg-slate-900 dark:bg-fleet-blue text-white shadow-lg shadow-slate-900/20" 
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200"
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
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl p-8">
                     <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-6">Informations personnelles</h2>
                     
                     <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-fleet-blue to-fleet-blue-dark flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-fleet-blue/20 border-4 border-white dark:border-slate-900">
                           {session?.user?.name?.charAt(0)?.toUpperCase() || "A"}
                        </div>
                        <div>
                           <Button variant="secondary" className="mb-2">Changer la photo</Button>
                           <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Format recommandé: 256x256px JPG, PNG.</p>
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
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl p-8">
                     <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-6">Informations de l'entreprise</h2>
                     <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
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
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl p-8">
                     <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-6">Préférences de notification</h2>
                     
                     <div className="space-y-4">
                        {[
                           { title: "Alertes Maintenance", desc: "Être prévenu lorsqu'un camion nécessite une révision ou un entretien.", checked: true },
                           { title: "Rapports Hebdomadaires", desc: "Recevoir un résumé par email de l'activité financière (ventes et charges).", checked: true },
                           { title: "Alertes Facturation", desc: "Notifications pour les factures impayées ou en retard.", checked: false },
                           { title: "Activité Système", desc: "Recevoir un email lors de la connexion d'un nouvel appareil au compte admin.", checked: true },
                        ].map((notif, idx) => (
                           <div key={idx} className="flex items-start justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-fleet-blue/20 dark:hover:border-fleet-blue/30 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-fleet-blue/5 dark:hover:bg-fleet-blue/10 transition-colors">
                              <div>
                                 <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{notif.title}</h3>
                                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{notif.desc}</p>
                              </div>
                              {/* Toggle switch mockup */}
                              <div className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${notif.checked ? 'bg-fleet-blue' : 'bg-slate-300 dark:bg-slate-700'}`}>
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
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl p-8">
                     <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-6">Changer le mot de passe</h2>
                     
                     <div className="space-y-4 max-w-md">
                        <Input label="Mot de passe actuel" type="password" />
                        <Input label="Nouveau mot de passe" type="password" />
                        <Input label="Confirmer le nouveau mot de passe" type="password" />
                     </div>
                     <div className="mt-8 flex justify-start">
                        <Button className="bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white shadow-xl shadow-slate-900/20">Mettre à jour le mot de passe</Button>
                     </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/50 shadow-sm rounded-2xl p-8">
                     <h2 className="text-lg font-black text-rose-600 dark:text-rose-400 mb-2">Zone de danger</h2>
                     <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Actions critiques liées à votre compte et vos données.</p>
                     
                     <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-rose-50/50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-900/50">
                        <div>
                           <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Supprimer le compte</h3>
                           <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cette action effacera toutes les données de manière irréversible.</p>
                        </div>
                        <button className="px-4 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50 text-xs font-bold rounded-xl transition-colors whitespace-nowrap">
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
