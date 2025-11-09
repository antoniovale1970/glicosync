import React, { useState, useMemo, useRef } from 'react';
import type { Contact } from '../types';
import { UserIcon } from './icons/UserIcon';
import { HospitalIcon } from './icons/HospitalIcon';
import { TestTubeIcon } from './icons/TestTubeIcon';
import { PrinterIcon } from './icons/PrinterIcon';

interface PhoneListProps {
  contacts: Contact[];
}

const getCategoryIcon = (type: Contact['type']) => {
    switch(type) {
        case 'Médico':
        case 'Familiar':
        case 'Emergência':
        case 'Outro':
            return <UserIcon className="w-6 h-6 text-slate-400" />;
        case 'Clínica':
        case 'Hospital':
            return <HospitalIcon className="w-6 h-6 text-slate-400" />;
        case 'Laboratório':
            return <TestTubeIcon className="w-6 h-6 text-slate-400" />;
        default:
            return <UserIcon className="w-6 h-6 text-slate-400" />;
    }
}


export const PhoneList: React.FC<PhoneListProps> = ({ contacts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const printableContentRef = useRef<HTMLDivElement>(null);

  const categorizedContacts = useMemo(() => {
    const filtered = contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filtered.length === 0) {
      return {};
    }

    return filtered.reduce((acc, contact) => {
      const type = contact.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(contact);
      return acc;
    }, {} as Record<Contact['type'], Contact[]>);
  }, [contacts, searchTerm]);

  const sortedCategories = Object.keys(categorizedContacts).sort((a, b) => a.localeCompare(b));
  
  const handlePrint = () => {
    const contentEl = printableContentRef.current;
    if (!contentEl) {
      console.error("Elemento para impressão não encontrado.");
      return;
    }
    const title = "Lista Telefônica";

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert("Por favor, habilite os pop-ups para que a impressão funcione.");
      return;
    }

    const stylesHtml = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('');

    const contentHtml = contentEl.innerHTML;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          ${stylesHtml}
          <style>
            @media print {
              body {
                margin: 1.5rem;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              /* Force light mode for printing */
              body, div, p, h1, h2, h3, h4, li, strong, table, th, td, span {
                background: transparent !important;
                color: #000 !important;
                box-shadow: none !important;
                text-shadow: none !important;
              }
              a, a:visited {
                text-decoration: none;
                color: #000 !important;
              }
              table, th, td {
                 border: 1px solid #ccc !important;
              }
              /* Hide elements not meant for printing */
              button, .print-hide, svg {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${contentHtml}
        </body>
      </html>
    `);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 500);
  };
  

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-100">Lista Telefônica</h1>

      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex-grow w-full">
            <label htmlFor="searchContacts" className="block text-sm font-medium text-slate-400">
              Pesquisar Contatos
            </label>
            <input
              id="searchContacts"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 block w-full max-w-lg px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              placeholder="Digite um nome ou categoria..."
            />
          </div>
           <div className="flex items-center gap-2 self-start md:self-center">
                <button
                    onClick={handlePrint}
                    disabled={contacts.length === 0}
                    className="flex items-center bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-500 transition-colors shadow-sm disabled:bg-slate-600 disabled:cursor-not-allowed"
                    title="Salvar ou Imprimir"
                >
                    <PrinterIcon className="w-5 h-5 mr-2" />
                    Salvar / Imprimir
                </button>
            </div>
        </div>

        <div ref={printableContentRef}>
          {contacts.length === 0 ? (
              <p className="text-center text-slate-400 py-10">
                  Nenhum contato cadastrado. Adicione contatos na tela de "Contatos" para vê-los aqui.
              </p>
          ) : sortedCategories.length > 0 ? (
            <div className="space-y-8">
              {sortedCategories.map(category => (
                <div key={category}>
                  <div className="flex items-center gap-3 border-b-2 border-slate-700 pb-2 mb-4">
                    {getCategoryIcon(category as Contact['type'])}
                    <h2 className="text-xl font-semibold text-sky-400">{category}</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-slate-200">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
                        <tr>
                          <th scope="col" className="px-6 py-3">Nome</th>
                          <th scope="col" className="px-6 py-3">Telefone</th>
                          <th scope="col" className="px-6 py-3">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categorizedContacts[category as Contact['type']].map(contact => (
                          <tr key={contact.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                            <td className="px-6 py-4 font-medium text-slate-100 whitespace-nowrap">{contact.name}</td>
                            <td className="px-6 py-4">
                              <a href={`tel:${contact.phone}`} className="hover:text-sky-400 transition-colors">{contact.phone}</a>
                            </td>
                            <td className="px-6 py-4">
                              {contact.email ? (
                                  <a href={`mailto:${contact.email}`} className="hover:text-sky-400 transition-colors break-all">{contact.email}</a>
                              ) : (
                                  <span className="text-slate-500">N/A</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-400 py-10">
              Nenhum contato encontrado para "{searchTerm}".
            </p>
          )}
        </div>
      </div>
    </div>
  );
};