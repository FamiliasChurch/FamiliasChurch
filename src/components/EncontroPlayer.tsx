import React from "react";

// O "export default" é o que transforma o arquivo em um módulo
export default function EncontroPlayer({ url }: { url: string }) {
  const getYouTubeID = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
          const match = url.match(regExp);
              return (match && match[2].length === 11) ? match[2] : null;
                };

                  const videoID = getYouTubeID(url);

                    if (!videoID) return null;

                      return (
                          <div className="encontro-player-wrapper" style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                                <iframe
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px' }}
                                                src={`https://www.youtube.com/embed/${videoID}?rel=0&modestbranding=1`}
                                                        title="Encontro com Deus"
                                                                frameBorder="0"
                                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                                allowFullScreen
                                                                                      ></iframe>
                                                                                          </div>
                                                                                            );
                                                                                            }
                                                                                            