import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Calendar, Clock, MapPin, Share2, CalendarPlus } from "lucide-react";

interface EventoIgreja {
    id: string;
    titulo: string;
    data: any;
    local?: string;
    horario?: string;
}

export default function PublicEvents() {
    const [eventos, setEventos] = useState<EventoIgreja[]>([]);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // FUNÇÃO QUE RESOLVE O ERRO DO SEU PRINT
    const gerarLinkAgenda = (evento: EventoIgreja) => {
        const data = evento.data?.toDate();
        if (!data) return "#";
        const dataFormatada = data.toISOString().replace(/-|:|\.\d+/g, "");
        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(evento.titulo)}&dates=${dataFormatada}/${dataFormatada}`;
    };

    useEffect(() => {
        const q = query(collection(db, "eventos"), orderBy("data", "asc"));
        const unsub = onSnapshot(q, (snap) => {
            const todosEventos = snap.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as Omit<EventoIgreja, 'id'>)
            }));

            const eventosFuturos = todosEventos.filter(evento => {
                const dataEvento = evento.data?.toDate();
                return dataEvento >= hoje;
            });

            setEventos(eventosFuturos);
        });
        return () => unsub();
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6">
            {eventos.map(evento => (
                <div key={evento.id} className="...">
                    <h3 className="...">{evento.titulo}</h3>
                    <a href={gerarLinkAgenda(evento)} target="_blank" className="...">
                        <CalendarPlus size={14} /> Salvar na Agenda
                    </a>
                </div>
            ))}
        </div>
    );
}