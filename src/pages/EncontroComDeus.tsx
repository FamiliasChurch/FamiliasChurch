import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import EncontroPlayer from "../components/EncontroPlayer";

export default function EncontroComDeus() {
  const [videoUrl, setVideoUrl] = useState<string>("");
    const [loading, setLoading] = useState(true);

      useEffect(() => {
          // Busca as informações da página no banco. 
              // Sugestão: crie uma coleção 'paginas' e um documento 'encontro'
                  const unsub = onSnapshot(doc(db, "paginas", "encontro"), (doc) => {
                        if (doc.exists()) {
                                setVideoUrl(doc.data().videoUrl || "");
                                      }
                                            setLoading(false);
                                                });

                                                    return () => unsub();
                                                      }, []);

                                                        if (loading) return <div className="loading-state">Carregando...</div>;

                                                          return (
                                                              <main className="encontro-page-main">
                                                                    {/* O CSS dessa classe abaixo será responsável pelo background que a outra pessoa fará */}
                                                                          <div className="encontro-background-overlay">
                                                                                  <div className="encontro-content-container">
                                                                                            
                                                                                                      <header className="encontro-header">
                                                                                                                  <h1 className="encontro-title">Encontro com Deus</h1>
                                                                                                                              <p className="encontro-subtitle">Assista à preleção oficial</p>
                                                                                                                                        </header>

                                                                                                                                                  <section className="encontro-video-section">
                                                                                                                                                              {videoUrl ? (
                                                                                                                                                                            <EncontroPlayer url={videoUrl} />
                                                                                                                                                                                        ) : (
                                                                                                                                                                                                      <div className="no-video-message">
                                                                                                                                                                                                                      O vídeo estará disponível em breve.
                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                )}
                                                                                                                                                                                                                                                          </section>

                                                                                                                                                                                                                                                                    <footer className="encontro-footer">
                                                                                                                                                                                                                                                                                {/* Espaço para informações adicionais ou botões de ação */}
                                                                                                                                                                                                                                                                                          </footer>

                                                                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                                                                                            </main>
                                                                                                                                                                                                                                                                                                              );
                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                              