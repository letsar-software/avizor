import { Database, FileCheck, LockKeyhole, Mail, ShieldCheck, UserRoundCheck } from "lucide-react";
import Accordion from "@/components/Accordion";
const sections=[
 {Icon:Database,title:"1. Qué datos recopilamos",text:"Solo recopilamos la información que decidís compartir: tu email si elegís guardar seguimiento y los datos necesarios de la consulta."},
 {Icon:FileCheck,title:"2. Qué NO recopilamos",text:"No solicitamos documentos, información financiera, ubicación exacta del lote ni datos innecesarios para el servicio."},
 {Icon:Database,title:"3. Para qué usamos tus datos",text:"Usamos tus datos únicamente para brindar el servicio y las comunicaciones que aceptaste recibir."},
 {Icon:LockKeyhole,title:"4. Cómo los protegemos",text:"Aplicamos medidas técnicas y organizativas para limitar el acceso y proteger la información almacenada."},
 {Icon:UserRoundCheck,title:"5. Tus derechos",text:"Podés pedir acceso, corrección o eliminación de tus datos en cualquier momento."},
 {Icon:Mail,title:"6. Contacto",text:"Para consultas de privacidad escribinos a hola@avizor.com.ar."},
];
export default function PrivacyPage(){return <main className="mx-auto max-w-[860px] px-5 py-9 text-[#081a31] sm:px-8 sm:py-12"><header><h1 className="text-[34px] font-bold">Privacidad</h1><span className="mt-3 block h-0.5 w-9 bg-[#168c50]"/><p className="mt-5 text-sm leading-6 text-[#405369]">Tu privacidad es importante. En Avizor cuidamos tu información y te explicamos claramente qué datos recopilamos y para qué.</p></header><div className="mt-6 space-y-3">{sections.map(({Icon,title,text},index)=><Accordion key={title} id={`privacy-${index}`} title={title} icon={<Icon className="h-5 w-5"/>} defaultOpen={index===0}><p>{text}</p></Accordion>)}</div></main>}
