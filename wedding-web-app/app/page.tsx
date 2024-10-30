"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Search, Heart, Users, Upload, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MapaAssentosGrafo from "./MapaAssentosGrafo";

const MapaAssentosCasamento = () => {
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [mesaSelecionada, setMesaSelecionada] = useState(null);
  const [dadosAssentos, setDadosAssentos] = useState({});
  const [erro, setErro] = useState("");
  const [modoGrafo, setModoGrafo] = useState(false);

  const processarDadosConvidados = (dados) => {
    const dadosProcessados = dados.reduce((acc, linha) => {
      // Garantindo que a coluna "Assigned Table No" contenha um número válido
      const numeroMesa = parseInt(linha["Assigned Table No"]);
      if (isNaN(numeroMesa)) return acc; // Ignora linhas sem mesa atribuída

      if (!acc[numeroMesa]) {
        acc[numeroMesa] = [];
      }

      const nomeConvidado = linha.Guest.trim();
      if (nomeConvidado.startsWith("Spare Seat")) return acc;

      const relacionamentos = [];

      // Verificando os campos "Together" e "Apart" para adicionar relacionamentos
      for (let i = 1; i <= 3; i++) {
        const junto = linha[`Together${i}`]?.trim();
        if (junto) {
          relacionamentos.push(`Junto com: ${junto}`);
        }

        const separado = linha[`Apart${i}`]?.trim();
        if (separado) {
          relacionamentos.push(`Separado de: ${separado}`);
        }
      }

      // Adiciona o convidado à mesa correspondente
      acc[numeroMesa].push({
        name: linha.Guest.trim(),
        relationships: relacionamentos,
      });

      return acc;
    }, {});

    console.log("Dados processados:", dadosProcessados);

    setDadosAssentos(dadosProcessados);
  };

  const handleUploadArquivo = async (evento) => {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;

    try {
      setErro("");
      const extensaoArquivo = arquivo.name.split(".").pop().toLowerCase();

      if (extensaoArquivo === "csv") {
        const texto = await arquivo.text();
        const linhas = texto.split("\n");
        const cabecalhos = linhas[0].split(",").map((h) => h.trim());

        const dados = linhas.slice(1).map((linha) => {
          const valores = linha.split(",");

          return cabecalhos.reduce((obj, cabecalho, index) => {
            obj[cabecalho] = valores[index]?.trim() || "";
            return obj;
          }, {});
        });

        processarDadosConvidados(dados);
      } else {
        throw new Error(
          "Formato de arquivo não suportado. Por favor, envie um arquivo CSV"
        );
      }
    } catch (err) {
      setErro(err.message);
      console.error("Erro ao processar arquivo:", err);
    }
  };

  const convidadosFiltrados = Object.entries(dadosAssentos).reduce(
    (acc, [numMesa, convidados]) => {
      const filtrados = convidados.filter((convidado) =>
        convidado.name.toLowerCase().includes(termoPesquisa.toLowerCase())
      );
      if (filtrados.length > 0) {
        acc[numMesa] = filtrados;
      }
      return acc;
    },
    {}
  );

  const CartaoMesa = ({ numeroMesa, convidados }) => (
    <Card
      className={`w-72 m-4 pb-2 cursor-pointer transition-all hover:shadow-lg relative overflow-hidden
        ${mesaSelecionada === numeroMesa ? "ring-2 ring-primary" : ""}`}
      onClick={() =>
        setMesaSelecionada(numeroMesa === mesaSelecionada ? null : numeroMesa)
      }
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-200 via-pink-300 to-pink-200" />
      <CardHeader className="text-center pb-2">
        <div className="flex items-center justify-center space-x-2">
          <Heart className="w-4 h-4 text-pink-400" />
          <CardTitle className="font-serif">Mesa {numeroMesa}</CardTitle>
          <Heart className="w-4 h-4 text-pink-400" />
        </div>
        <div className="flex items-center justify-center mt-1 text-sm text-muted-foreground">
          <Users className="w-4 h-4 mr-1" />
          <span>{convidados.length} Convidados</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 bg-secondary/20 p-3 rounded-lg">
          {convidados.map((convidado, index) => (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-sm truncate hover:bg-white/50 p-2 rounded-md transition-colors">
                    {convidado.name}
                  </div>
                </TooltipTrigger>
                {convidado.relationships.length > 0 && (
                  <TooltipContent className="bg-white/95 backdrop-blur-sm">
                    <div className="space-y-1">
                      {convidado.relationships.map((rel, idx) => (
                        <Badge
                          key={idx}
                          variant={
                            rel.includes("Separado") ? "destructive" : "default"
                          }
                          className={
                            rel.includes("Separado")
                              ? ""
                              : "bg-pink-100 hover:bg-pink-200 text-pink-800"
                          }
                        >
                          {rel}
                        </Badge>
                      ))}
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const UploadCard = () => (
    <>
      <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
        <div className="w-full flex gap-4">
          <Button
            variant="outline"
            className="flex-1 border-dashed border-2 h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => document.getElementById("file-upload").click()}
          >
            <FileSpreadsheet className="w-6 h-6 text-pink-400" />
            <span className="text-sm text-muted-foreground">
              Carregar Lista de Convidados
            </span>
            <span className="text-xs text-muted-foreground">(CSV)</span>
          </Button>
          <input
            id="file-upload"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleUploadArquivo}
            className="hidden"
          />
        </div>

        {erro && (
          <Alert variant="destructive" className="w-full">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center space-x-2 w-full">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar convidados..."
            value={termoPesquisa}
            onChange={(e) => setTermoPesquisa(e.target.value)}
            className="border-pink-100 focus-visible:ring-pink-200"
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2 justify-center">
        <Badge
          variant="default"
          className="bg-pink-100 hover:bg-pink-200 text-pink-800"
        >
          Junto com
        </Badge>
        <Badge variant="destructive">Separado de</Badge>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-8">
      <Card className="mb-8 border-none shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center border-b border-pink-100 pb-6">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <Heart className="w-6 h-6 text-pink-400" />
            <CardTitle className="font-serif text-3xl">
              Mapa de Assentos do Casamento
            </CardTitle>
            <Heart className="w-6 h-6 text-pink-400" />
          </div>
          <p className="text-muted-foreground italic">
            Encontre seu lugar especial no nosso grande dia
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <UploadCard />
        </CardContent>
      </Card>
      <Tabs defaultValue="mapa">
        <TabsList>
          <TabsTrigger value="mapa">Mapa</TabsTrigger>
          <TabsTrigger value="grafo">Visualizar Grafo</TabsTrigger>
        </TabsList>
        <TabsContent value="mapa" className="w-full">
          <div className="mx-auto">
            <div className="flex flex-wrap justify-center gap-6">
              {Object.entries(convidadosFiltrados).map(
                ([numeroMesa, convidados]) => (
                  <CartaoMesa
                    key={numeroMesa}
                    numeroMesa={numeroMesa}
                    convidados={convidados}
                  />
                )
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="grafo" className="w-full">
          <MapaAssentosGrafo dadosAssentos={dadosAssentos}></MapaAssentosGrafo>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MapaAssentosCasamento;
