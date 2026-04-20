import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  MapPin, Clock, Ticket, User, X, CheckCircle,
  ChevronDown, ChevronRight, ChevronLeft, Printer
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Colors, Spacing, Radius, Shadow } from '../../constants/theme';

const BASE = 'http://localhost:5000/api';
const { width } = Dimensions.get('window');

interface Station { arret: string; distance_km: number; }
interface Ligne { num_ligne: number | string; ville_depart: string; ville_arrivee: string; horaires: string[]; horaire?: string; stations: Station[]; }
interface TarifCfg { prix_par_km: number; frais_fixes: number; red_etudiant: number; red_handicape: number; }

const SEAT_ROWS = 'ABCDEFGHIJKLM'.split('');
const TARIFS = [
  { key: 'Tarif Plein', label: 'Plein tarif',    reduc: 0,  color: Colors.primary },
  { key: 'Étudiant',   label: 'Étudiant',        reduc: 25, color: Colors.success },
  { key: 'Handicapé',  label: 'Handicapé(e)',     reduc: 50, color: Colors.warning },
  { key: 'Militaire',  label: 'Militaire',        reduc: 30, color: '#7C3AED'      },
];

// ── Steps ──────────────────────────────────────────────────────────────────
const STEPS = ['Trajet', 'Tarif & Siège', 'Récapitulatif'];

export default function VenteScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const numero_bus  = params.numero_bus as string;
  const service_id  = params.service_id as string;
  const num_ligne   = params.num_ligne as string;
  const ville_dep   = params.ville_depart as string;
  const ville_arr   = params.ville_arrivee as string;
  const nom         = params.nom as string;
  const prenom      = params.prenom as string;

  // ── Data
  const [ligne, setLigne]         = useState<Ligne | null>(null);
  const [tarifCfg, setTarifCfg]   = useState<TarifCfg | null>(null);
  const [occupied, setOccupied]   = useState<string[]>([]);
  const [loading, setLoading]     = useState(true);

  // ── Step state
  const [step, setStep]           = useState(0);

  // ── Step 1: Trajet
  const [horaire, setHoraire]         = useState('');
  const [showHoraire, setShowHoraire] = useState(false);
  const [depart, setDepart]           = useState('');
  const [showDepart, setShowDepart]   = useState(false);
  const [arrivee, setArrivee]         = useState('');
  const [showArrivee, setShowArrivee] = useState(false);

  // ── Step 2: Tarif & Siège
  const [tarifsDb, setTarifsDb] = useState<any[]>([]);
  const [bagagesDb, setBagagesDb] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('VOYAGEUR');
  const [selectedTarifId, setSelectedTarifId] = useState('');
  const [selectedBagageId, setSelectedBagageId] = useState('');
  const [selectedSeat, setSeat]     = useState<string | null>(null);

  // ── Step 3: Result
  const [selling, setSelling]   = useState(false);
  const [ticketModal, setModal] = useState(false);
  const [lastTicket, setLastTicket] = useState<any>(null);

  // ── Load data ───────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [netRes, tarifRes, tRes, bRes] = await Promise.all([
          axios.get<Ligne[]>(`${BASE}/network`),
          axios.get<TarifCfg>(`${BASE}/tarifs`),
          axios.get<any[]>(`${BASE}/tarification`),
          axios.get<any[]>(`${BASE}/tarification/bagages`)
        ]);
        const found = netRes.data.find(l => String(l.num_ligne) === String(num_ligne));
        setLigne(found ?? null);
        setTarifCfg(tarifRes.data);
        
        if (tRes.data && !tRes.data.message) {
            setTarifsDb(tRes.data.filter((t: any) => t.actif));
            const voyageurs = tRes.data.filter((t: any) => t.actif && t.categorie === 'VOYAGEUR');
            if(voyageurs.length > 0) setSelectedTarifId(voyageurs[0].id_type_tarification.toString());
        }
        if (bRes.data && !bRes.data.message) {
            setBagagesDb(bRes.data.filter((b: any) => b.actif));
        }
      } catch { /**/ }
      finally { setLoading(false); }
    };
    if (num_ligne) load(); else setLoading(false);
  }, []);

  useEffect(() => {
    if (!horaire || !num_ligne || !depart || !arrivee) return;
    const today = new Date().toISOString().split('T')[0];
    axios.get<string[]>(`${BASE}/sales/tickets/occupied-seats?num_ligne=${num_ligne}&date=${today}&heure=${horaire}&depart=${encodeURIComponent(depart)}&arrivee=${encodeURIComponent(arrivee)}`)
      .then(r => setOccupied(r.data))
      .catch(() => setOccupied([]));
    setSeat(null);
  }, [horaire, depart, arrivee]);

  // ── Derived ─────────────────────────────────────────────────────────────
  const stations = useMemo<Station[]>(() => {
    if (!ligne) return [];
    const list = [...(ligne.stations || [])];
    if (!list.some(s => s.arret.toLowerCase() === (ligne.ville_depart ?? '').toLowerCase()))
      list.push({ arret: ligne.ville_depart, distance_km: 0 });
    if (!list.some(s => s.arret.toLowerCase() === (ligne.ville_arrivee ?? '').toLowerCase()))
      list.push({ arret: ligne.ville_arrivee, distance_km: 999 });
    return list.sort((a, b) => a.distance_km - b.distance_km);
  }, [ligne]);

  const deptSt  = stations.find(s => s.arret === depart);
  const arrivSt = stations.find(s => s.arret === arrivee);
  const distance = deptSt && arrivSt ? Math.abs(arrivSt.distance_km - deptSt.distance_km) : 0;

  const arriveeOptions = depart
    ? stations.filter(s => s.arret !== depart && (deptSt ? s.distance_km > deptSt.distance_km : true))
    : [];

  const currentTarif = tarifsDb.find(t => String(t.id_type_tarification) === String(selectedTarifId));
  const currentBagage = bagagesDb.find(b => String(b.id_type_bagage) === String(selectedBagageId));

  const prix = useMemo(() => {
    if (!tarifCfg || distance <= 0 || !currentTarif) return 0;
    
    let basePrice = distance * tarifCfg.prix_par_km + parseFloat(tarifCfg.frais_fixes.toString());
    let total = 0;
    
    if (currentTarif.mode_calcul === 'PERCENT_RESTANT') {
        total = basePrice * (currentTarif.valeur / 100);
    } else if (currentTarif.mode_calcul === 'FIXE') {
        total = parseFloat(currentTarif.valeur.toString()) / 1000;
    }

    if (currentBagage) {
        total += parseFloat(currentBagage.prix.toString()) / 1000;
    }
    
    return Math.max(0, total);
  }, [tarifCfg, distance, currentTarif, currentBagage]);

  const horaires: string[] = ligne?.horaires?.filter(Boolean) ?? (ligne?.horaire ? [ligne.horaire] : []);

  // ── Step validation
  const step0Valid = !!horaire && !!depart && !!arrivee;
  const step1Valid = !!selectedSeat;

  // ── Seat grid ───────────────────────────────────────────────────────────
  const capacite = 50;
  const numRows  = Math.ceil(capacite / 5);
  const SEAT_SZ  = Math.min(40, (width - 80) / 5);

  const renderSeats = () => {
    const rows = [];
    for (let i = 0; i < Math.min(numRows, SEAT_ROWS.length); i++) {
      const row = SEAT_ROWS[i];
      const cols = Math.min(5, capacite - i * 5);
      const cells = [];
      for (let c = 1; c <= cols; c++) {
        const id = `${row}${c}`;
        const occ = occupied.includes(id);
        const sel = selectedSeat === id;
        cells.push(
          <TouchableOpacity
            key={id}
            style={[styles.seat,
              occ ? styles.seatOcc : sel ? styles.seatSel : styles.seatFree
            ]}
            onPress={() => !occ && setSeat(sel ? null : id)}
            disabled={occ}
          >
            <Text style={[styles.seatTxt, occ ? styles.seatTxtOcc : sel ? styles.seatTxtSel : styles.seatTxtFree]}>
              {id}
            </Text>
          </TouchableOpacity>
        );
      }
      rows.push(<View key={row} style={styles.seatRow}>{cells}</View>);
    }
    return rows;
  };

  // ── Sell ────────────────────────────────────────────────────────────────
  const handleSell = async () => {
    if (!selectedSeat || !depart || !arrivee || !horaire) return;
    setSelling(true);
    const today = new Date().toISOString().split('T')[0];
      const payload = {
        num_ligne, bus: numero_bus,
        date_voyage: today, heure: horaire, siege: selectedSeat,
        prix, arret_depart: depart, arret_arrivee: arrivee,
        agent_id: null, 
        type_tarif: currentTarif ? currentTarif.libelle : 'Tarif Normal',
        id_type_tarification: currentTarif ? currentTarif.id_type_tarification : null,
        id_type_bagage: currentBagage ? currentBagage.id_type_bagage : null,
        prix_bagage: currentBagage ? parseFloat(currentBagage.prix) / 1000 : 0,
        id_service: service_id ? parseInt(service_id) : null,
      };

      const r = await axios.post<any>(`${BASE}/sales/tickets/vendre`, payload);
      setOccupied(prev => [...prev, selectedSeat]);
      const code = 'TKT' + Date.now().toString().slice(-6);
      setLastTicket({
        code_ticket: r.data?.code_ticket || code,
        siege: selectedSeat, 
        type_tarif: currentTarif ? currentTarif.libelle : 'Tarif Normal',
        montant_total: prix, station_depart: depart,
        station_arrivee: arrivee, heure_depart: horaire,
        date_emission: new Date().toISOString(),
        numero_bus, num_ligne,
      });
      setSeat(null);
      setStep(0);
      setDepart(''); setArrivee(''); setSeat(null);
      setModal(true);
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || 'Impossible d\'émettre le billet');
    } finally { setSelling(false); }
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* ── Steps Bar ── */}
      <View style={styles.stepsBar}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepNum, i <= step && styles.stepNumActive, i < step && styles.stepNumDone]}>
              {i < step
                ? <CheckCircle color={Colors.white} size={14} />
                : <Text style={[styles.stepNumText, i === step && styles.stepNumTextActive]}>{i + 1}</Text>
              }
            </View>
            <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{s}</Text>
            {i < STEPS.length - 1 && <View style={[styles.stepConnector, i < step && styles.stepConnectorDone]} />}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ══ STEP 0: TRAJET ══════════════════════════════════════════ */}
        {step === 0 && (
          <>
            {/* Service banner */}
            <View style={styles.serviceBanner}>
              <View style={styles.bannerDot} />
              <Text style={styles.bannerText}>
                Service #{service_id} · Bus {numero_bus} · Ligne {num_ligne}
              </Text>
            </View>

            {/* Horaire */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}><Clock size={14} color={Colors.textMid} /> Horaire de départ</Text>
              {horaires.length > 0 ? (
                <>
                  <TouchableOpacity style={styles.picker} onPress={() => { setShowHoraire(!showHoraire); setShowDepart(false); setShowArrivee(false); }}>
                    <Text style={horaire ? styles.pickerVal : styles.pickerPh}>{horaire || 'Choisir un horaire...'}</Text>
                    <ChevronDown color={Colors.textMuted} size={18} />
                  </TouchableOpacity>
                  {showHoraire && (
                    <View style={styles.dropdown}>
                      {horaires.map(h => (
                        <TouchableOpacity
                          key={h}
                          style={[styles.ddItem, horaire === h && styles.ddItemActive]}
                          onPress={() => { setHoraire(h); setShowHoraire(false); }}
                        >
                          <Clock color={horaire === h ? Colors.primary : Colors.textMuted} size={14} />
                          <Text style={[styles.ddItemText, horaire === h && styles.ddItemTextActive]}>{h}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <View style={[styles.picker, { opacity: 0.5 }]}>
                  <Text style={styles.pickerPh}>Aucun horaire défini pour cette ligne</Text>
                </View>
              )}
            </View>

            {/* Station départ */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}><MapPin size={14} color={Colors.success} /> Point de montée</Text>
              <TouchableOpacity style={styles.picker} onPress={() => { setShowDepart(!showDepart); setShowHoraire(false); setShowArrivee(false); }}>
                <Text style={depart ? styles.pickerVal : styles.pickerPh}>{depart || 'Station de départ...'}</Text>
                <ChevronDown color={Colors.textMuted} size={18} />
              </TouchableOpacity>
              {showDepart && (
                <View style={styles.dropdown}>
                  {stations.map(s => (
                    <TouchableOpacity
                      key={s.arret}
                      style={[styles.ddItem, depart === s.arret && styles.ddItemActive]}
                      onPress={() => { setDepart(s.arret); setArrivee(''); setShowDepart(false); }}
                    >
                      <Text style={[styles.ddItemText, depart === s.arret && styles.ddItemTextActive]}>
                        {s.arret}
                      </Text>
                      <Text style={styles.ddItemSub}>{s.distance_km} km</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Station arrivée */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}><MapPin size={14} color={Colors.danger} /> Destination</Text>
              {!depart ? (
                <View style={[styles.picker, { opacity: 0.4 }]}>
                  <Text style={styles.pickerPh}>Choisissez d'abord le départ</Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity style={styles.picker} onPress={() => { setShowArrivee(!showArrivee); setShowHoraire(false); setShowDepart(false); }}>
                    <Text style={arrivee ? styles.pickerVal : styles.pickerPh}>{arrivee || 'Destination...'}</Text>
                    <ChevronDown color={Colors.textMuted} size={18} />
                  </TouchableOpacity>
                  {showArrivee && (
                    <View style={styles.dropdown}>
                      {arriveeOptions.length === 0
                        ? <View style={styles.ddItem}><Text style={{ color: Colors.textMuted, fontSize: 13 }}>Aucune station après ce départ</Text></View>
                        : arriveeOptions.map(s => (
                          <TouchableOpacity
                            key={s.arret}
                            style={[styles.ddItem, arrivee === s.arret && styles.ddItemActive]}
                            onPress={() => { setArrivee(s.arret); setShowArrivee(false); }}
                          >
                            <Text style={[styles.ddItemText, arrivee === s.arret && styles.ddItemTextActive]}>{s.arret}</Text>
                            <Text style={styles.ddItemSub}>{s.distance_km} km</Text>
                          </TouchableOpacity>
                        ))
                      }
                    </View>
                  )}
                </>
              )}
              {distance > 0 && (
                <View style={styles.distBadge}>
                  <ChevronRight color={Colors.success} size={13} />
                  <Text style={styles.distText}>{depart} → {arrivee} · {distance.toFixed(1)} km</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.nextBtn, !step0Valid && styles.nextBtnDisabled]}
              onPress={() => setStep(1)}
              disabled={!step0Valid}
            >
              <Text style={[styles.nextBtnText, !step0Valid && styles.nextBtnTextDis]}>Suivant — Choisir le tarif</Text>
              <ChevronRight color={step0Valid ? Colors.primary : Colors.textMuted} size={18} />
            </TouchableOpacity>
          </>
        )}

        {/* ══ STEP 1: TARIF & SIÈGE ══════════════════════════════════ */}
        {step === 1 && (
          <>
            {/* Route summary */}
            <View style={styles.routeSummary}>
              <View style={styles.routeSummaryItem}>
                <View style={[styles.rsDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.rsTxt}>{depart}</Text>
              </View>
              <View style={styles.rsLine} />
              <View style={styles.routeSummaryItem}>
                <View style={[styles.rsDot, { backgroundColor: Colors.danger }]} />
                <Text style={styles.rsTxt}>{arrivee}</Text>
              </View>
              <Text style={styles.rsDist}>{distance.toFixed(1)} km · {horaire}</Text>
            </View>

            {/* Tarif & Bagages */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}><User size={14} color={Colors.textMid} /> Type de tarif</Text>
              
              <Text style={{fontWeight:'bold', color: Colors.textMid, fontSize: 12, marginBottom: 5}}>1. Catégorie</Text>
              <View style={[styles.picker, {marginBottom: 10}]}>
                  <TouchableOpacity style={{flex: 1}} onPress={() => {}}>
                    <Text style={styles.pickerVal}>{selectedCategory === 'VOYAGEUR' ? 'Voyageur' : selectedCategory === 'CONVENTION' ? 'Convention' : 'Expédition'}</Text>
                  </TouchableOpacity>
                  <ChevronDown color={Colors.textMuted} size={18} />
              </View>
              <View style={styles.tarifGrid}>
                  {['VOYAGEUR', 'CONVENTION', 'EXPEDITION'].map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.tarifCard, selectedCategory === cat && { borderColor: Colors.primary, backgroundColor: Colors.primary + '12' }]}
                        onPress={() => {
                            setSelectedCategory(cat);
                            const ops = tarifsDb.filter((t:any) => t.categorie === cat);
                            if(ops.length > 0) setSelectedTarifId(ops[0].id_type_tarification.toString());
                            else setSelectedTarifId('');
                        }}
                      >
                        <Text style={[styles.tarifLabel, selectedCategory === cat && { color: Colors.primary }]}>{cat.substring(0, 4)}.</Text>
                      </TouchableOpacity>
                  ))}
              </View>

              <Text style={{fontWeight:'bold', color: Colors.textMid, fontSize: 12, marginTop: 15, marginBottom: 5}}>2. Tarification</Text>
              <View style={styles.tarifGrid}>
                {tarifsDb.filter((t:any) => t.categorie === selectedCategory).map((t:any) => (
                  <TouchableOpacity
                    key={t.id_type_tarification}
                    style={[styles.tarifCard, selectedTarifId == t.id_type_tarification && { borderColor: Colors.success, backgroundColor: Colors.success + '12' }]}
                    onPress={() => setSelectedTarifId(t.id_type_tarification.toString())}
                  >
                    <Text style={[styles.tarifLabel, selectedTarifId == t.id_type_tarification && { color: Colors.success }]}>{t.libelle}</Text>
                    <Text style={[styles.tarifReduc]}>{t.mode_calcul === 'PERCENT_RESTANT' ? t.valeur+'% R' : (parseFloat(t.valeur)/1000).toFixed(1)+' DT'}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{fontWeight:'bold', color: Colors.textMid, fontSize: 12, marginTop: 15, marginBottom: 5}}>3. Option Bagage</Text>
              <View style={[styles.tarifGrid, {marginBottom: 10}]}>
                <TouchableOpacity
                    style={[styles.tarifCard, !selectedBagageId && { borderColor: Colors.textMid, backgroundColor: Colors.bgMid }]}
                    onPress={() => setSelectedBagageId('')}
                >
                    <Text style={styles.tarifLabel}>Sans bg.</Text>
                </TouchableOpacity>
                {bagagesDb.map((b:any) => (
                    <TouchableOpacity
                        key={b.id_type_bagage}
                        style={[styles.tarifCard, selectedBagageId == b.id_type_bagage && { borderColor: Colors.warning, backgroundColor: Colors.warning + '12' }]}
                        onPress={() => setSelectedBagageId(b.id_type_bagage.toString())}
                    >
                        <Text style={[styles.tarifLabel, selectedBagageId == b.id_type_bagage && { color: Colors.warning }]}>{b.libelle}</Text>
                        <Text style={[styles.tarifReduc]}>{'+'+(parseFloat(b.prix)/1000).toFixed(1)+' DT'}</Text>
                    </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Seat Grid */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}><Ticket size={14} color={Colors.textMid} /> Sélection du siège</Text>
              <View style={styles.legend}>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.bgMid, borderColor: Colors.border, borderWidth: 1 }]} /><Text style={styles.legendTxt}>Libre</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.primary }]} /><Text style={styles.legendTxt}>Sélectionné</Text></View>
                <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.dangerLight }]} /><Text style={styles.legendTxt}>Occupé</Text></View>
              </View>
              {!horaire && (
                <Text style={styles.seatWarn}>Choisissez un horaire pour voir les sièges disponibles</Text>
              )}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.seatGrid}>{renderSeats()}</View>
              </ScrollView>
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(0)}>
                <ChevronLeft color={Colors.textMid} size={18} />
                <Text style={styles.backBtnText}>Retour</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextBtn, { flex: 1 }, !step1Valid && styles.nextBtnDisabled]}
                onPress={() => setStep(2)}
                disabled={!step1Valid}
              >
                <Text style={[styles.nextBtnText, !step1Valid && styles.nextBtnTextDis]}>Voir le récapitulatif</Text>
                <ChevronRight color={step1Valid ? Colors.primary : Colors.textMuted} size={18} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ══ STEP 2: RÉCAPITULATIF ══════════════════════════════════ */}
        {step === 2 && (
          <>
            <View style={styles.recap}>
              <Text style={styles.recapTitle}>Récapitulatif du billet</Text>
              <View style={styles.recapRow}><Text style={styles.recapLabel}>Bus</Text><Text style={styles.recapVal}>N° {numero_bus}</Text></View>
              <View style={styles.recapRow}><Text style={styles.recapLabel}>Ligne</Text><Text style={styles.recapVal}>{num_ligne}</Text></View>
              <View style={styles.recapRow}><Text style={styles.recapLabel}>Horaire</Text><Text style={styles.recapVal}>{horaire}</Text></View>
              <View style={styles.recapRow}><Text style={styles.recapLabel}>Départ</Text><Text style={styles.recapVal}>{depart}</Text></View>
              <View style={styles.recapRow}><Text style={styles.recapLabel}>Arrivée</Text><Text style={styles.recapVal}>{arrivee}</Text></View>
              <View style={styles.recapRow}><Text style={styles.recapLabel}>Distance</Text><Text style={styles.recapVal}>{distance.toFixed(1)} km</Text></View>
              <View style={styles.recapRow}><Text style={styles.recapLabel}>Siège</Text><Text style={[styles.recapVal, { color: Colors.primary, fontWeight: '900', fontSize: 18 }]}>{selectedSeat}</Text></View>
              <View style={styles.recapRow}><Text style={styles.recapLabel}>Tarif</Text>
                <Text style={styles.recapVal}>
                  {currentTarif ? currentTarif.libelle : 'Tarif Normal'}
                </Text>
              </View>
              {currentBagage && (
                <View style={styles.recapRow}><Text style={styles.recapLabel}>Bagage</Text>
                    <Text style={styles.recapVal}>+ {(parseFloat(currentBagage.prix)/1000).toFixed(3)} TND</Text>
                </View>
              )}
              <View style={[styles.recapRow, styles.recapTotal]}>
                <Text style={styles.recapTotalLabel}>TOTAL</Text>
                <Text style={styles.recapTotalVal}>{prix.toFixed(3)} TND</Text>
              </View>
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                <ChevronLeft color={Colors.textMid} size={18} />
                <Text style={styles.backBtnText}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sellBtn, selling && styles.nextBtnDisabled]}
                onPress={handleSell}
                disabled={selling}
              >
                {selling
                  ? <ActivityIndicator color={Colors.primary} />
                  : <><Printer color={Colors.primary} size={20} /><Text style={styles.sellBtnText}>Émettre le billet</Text></>
                }
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Ticket Modal ── */}
      <Modal visible={ticketModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.ticketSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.ticketHeader}>
              <CheckCircle color={Colors.success} size={32} strokeWidth={2} />
              <Text style={styles.ticketHeaderTitle}>Billet émis avec succès !</Text>
              <TouchableOpacity onPress={() => setModal(false)} style={styles.ticketClose}>
                <X color={Colors.textMuted} size={22} />
              </TouchableOpacity>
            </View>

            {lastTicket && (
              <View style={styles.ticketBody}>
                <Text style={styles.ticketBrand}>🚌 TuniMove</Text>
                <Text style={styles.ticketSubtitle}>Transport Interurbain</Text>
                <View style={styles.ticketDivider} />
                <View style={styles.ticketGrid}>
                  {[
                    ['Bus', `N° ${lastTicket.numero_bus}`],
                    ['Siège', lastTicket.siege],
                    ['Départ', lastTicket.station_depart],
                    ['Arrivée', lastTicket.station_arrivee],
                    ['Heure', lastTicket.heure_depart],
                    ['Tarif', lastTicket.type_tarif],
                  ].map(([k, v]) => (
                    <View key={k} style={styles.ticketField}>
                      <Text style={styles.ticketKey}>{k}</Text>
                      <Text style={[styles.ticketVal, k === 'Siège' && { fontSize: 22, color: Colors.primary }]}>{v}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.ticketDivider} />
                <View style={styles.ticketQR}>
                  <Text style={styles.qrLabel}>CODE DE VALIDATION</Text>
                  <Text style={styles.qrCode}>{lastTicket.code_ticket}</Text>
                  <Text style={styles.qrHint}>À présenter au contrôleur lors du contrôle</Text>
                </View>
                <View style={styles.ticketDivider} />
                <Text style={styles.ticketTotal}>{(lastTicket.montant_total as number).toFixed(3)} TND</Text>
                <Text style={styles.ticketFooter}>{prenom} {nom} · {new Date(lastTicket.date_emission).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.newTicketBtn} onPress={() => { setModal(false); }}>
              <Ticket color={Colors.primary} size={18} />
              <Text style={styles.newTicketBtnText}>Émettre un autre billet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const SEAT_SZ = Math.min(40, (width - 80) / 5);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgLight },
  content: { padding: Spacing.base, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgLight },

  // Steps Bar
  stepsBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepNum: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.bgMid, alignItems: 'center', justifyContent: 'center',
  },
  stepNumActive: { backgroundColor: Colors.primary },
  stepNumDone: { backgroundColor: Colors.success },
  stepNumText: { fontSize: 12, fontWeight: '800', color: Colors.textMuted },
  stepNumTextActive: { color: Colors.white },
  stepLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', marginLeft: 4 },
  stepLabelActive: { color: Colors.primary, fontWeight: '800' },
  stepConnector: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  stepConnectorDone: { backgroundColor: Colors.success },

  // Service Banner
  serviceBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary + '10', borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.primary + '20',
  },
  bannerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  bannerText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },

  // Section
  section: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.base, marginBottom: Spacing.sm, ...Shadow.card,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },

  // Picker
  picker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    height: 50, paddingHorizontal: 14, backgroundColor: Colors.bgLight,
  },
  pickerVal: { fontSize: 14, color: Colors.textDark, fontWeight: '600' },
  pickerPh: { fontSize: 14, color: Colors.textLight },

  // Dropdown
  dropdown: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    marginTop: 6, overflow: 'hidden', maxHeight: 200, backgroundColor: Colors.white,
  },
  ddItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 13, borderBottomWidth: 1, borderBottomColor: Colors.divider, gap: 8,
  },
  ddItemActive: { backgroundColor: Colors.primary + '10' },
  ddItemText: { fontSize: 14, color: Colors.textMid, flex: 1 },
  ddItemTextActive: { color: Colors.primary, fontWeight: '700' },
  ddItemSub: { fontSize: 12, color: Colors.textLight },

  // Distance badge
  distBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.successLight, borderRadius: Radius.pill,
    paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', marginTop: 8,
  },
  distText: { fontSize: 12, color: Colors.success, fontWeight: '700' },

  // Route Summary (step 1)
  routeSummary: {
    backgroundColor: Colors.primary, borderRadius: Radius.xl,
    padding: Spacing.base, marginBottom: Spacing.md, gap: 6, ...Shadow.strong,
  },
  routeSummaryItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rsDot: { width: 10, height: 10, borderRadius: 5 },
  rsTxt: { fontSize: 14, color: Colors.white, fontWeight: '700' },
  rsLine: { width: 2, height: 14, backgroundColor: Colors.white + '40', marginLeft: 4 },
  rsDist: { fontSize: 12, color: Colors.accent, fontWeight: '600', marginTop: 4 },

  // Tarif
  tarifGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tarifCard: {
    flex: 1, minWidth: '45%', alignItems: 'center', padding: 10,
    borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.bgLight, gap: 3,
  },
  tarifLabel: { fontSize: 13, fontWeight: '700', color: Colors.textMid },
  tarifReduc: { fontSize: 11, fontWeight: '700' },

  // Seats
  legend: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendTxt: { fontSize: 11, color: Colors.textMuted },
  seatWarn: { fontSize: 12, color: Colors.warning, fontWeight: '600', marginBottom: 8 },
  seatGrid: { gap: 5, paddingVertical: 4 },
  seatRow: { flexDirection: 'row', gap: 5 },
  seat: {
    width: SEAT_SZ, height: SEAT_SZ, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  seatFree: { backgroundColor: Colors.bgMid, borderColor: Colors.border },
  seatSel: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  seatOcc: { backgroundColor: Colors.dangerLight, borderColor: Colors.danger + '50' },
  seatTxt: { fontSize: 10, fontWeight: '700' },
  seatTxtFree: { color: Colors.textMid },
  seatTxtSel: { color: Colors.white },
  seatTxtOcc: { color: Colors.danger },

  // Recap
  recap: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.base, marginBottom: Spacing.md, ...Shadow.card,
  },
  recapTitle: { fontSize: 16, fontWeight: '800', color: Colors.textDark, marginBottom: Spacing.md },
  recapRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  recapLabel: { fontSize: 13, color: Colors.textMuted },
  recapVal: { fontSize: 13, fontWeight: '700', color: Colors.textDark },
  recapTotal: { borderBottomWidth: 0, marginTop: 6 },
  recapTotalLabel: { fontSize: 16, fontWeight: '800', color: Colors.textDark },
  recapTotalVal: { fontSize: 24, fontWeight: '900', color: Colors.primary },

  // Nav
  navRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'stretch' },
  nextBtn: {
    flex: 1, backgroundColor: Colors.accent, height: 52, borderRadius: Radius.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, ...Shadow.accent,
  },
  nextBtnDisabled: { backgroundColor: Colors.bgMid, shadowOpacity: 0, elevation: 0 },
  nextBtnText: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  nextBtnTextDis: { color: Colors.textMuted },
  backBtn: {
    backgroundColor: Colors.white, height: 52, borderRadius: Radius.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingHorizontal: 16, borderWidth: 1.5, borderColor: Colors.border,
  },
  backBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textMid },
  sellBtn: {
    flex: 1, backgroundColor: Colors.accent, height: 52, borderRadius: Radius.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...Shadow.accent,
  },
  sellBtnText: { fontSize: 15, fontWeight: '800', color: Colors.primary },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  ticketSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, maxHeight: '92%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.base },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.base },
  ticketHeaderTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: Colors.textDark },
  ticketClose: { padding: 4 },

  ticketBody: { alignItems: 'center' },
  ticketBrand: { fontSize: 20, fontWeight: '900', color: Colors.primary },
  ticketSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  ticketDivider: { width: '100%', height: 1, backgroundColor: Colors.divider, marginVertical: Spacing.md },
  ticketGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', gap: 8 },
  ticketField: { width: '48%', backgroundColor: Colors.bgLight, borderRadius: Radius.md, padding: 10 },
  ticketKey: { fontSize: 10, color: Colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  ticketVal: { fontSize: 14, fontWeight: '700', color: Colors.textDark, marginTop: 2 },
  ticketQR: { alignItems: 'center', width: '100%' },
  qrLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  qrCode: {
    fontFamily: 'monospace', fontSize: 18, fontWeight: '900', color: Colors.primary,
    letterSpacing: 3, backgroundColor: Colors.bgLight, paddingHorizontal: 20,
    paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: Colors.border,
  },
  qrHint: { fontSize: 11, color: Colors.textLight, marginTop: 6 },
  ticketTotal: { fontSize: 28, fontWeight: '900', color: Colors.primary, marginBottom: 4 },
  ticketFooter: { fontSize: 11, color: Colors.textLight },
  newTicketBtn: {
    backgroundColor: Colors.accent, height: 52, borderRadius: Radius.lg, marginTop: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  newTicketBtnText: { fontSize: 14, fontWeight: '800', color: Colors.primary },
});
