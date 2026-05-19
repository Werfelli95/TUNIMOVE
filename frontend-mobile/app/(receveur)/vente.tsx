import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Alert, ActivityIndicator, Dimensions, Platform, TextInput
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  MapPin, Clock, Ticket, User, X, CheckCircle,
  ChevronDown, ChevronRight, ChevronLeft, Printer, ShoppingBag, Info, Bus
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Colors, Spacing, Radius, Shadow, Typography } from '../../constants/theme';
import { API_BASE_URL, NETWORK_API, TARIFS_API, TARIFICATION_API, SALES_API } from '../../constants/api';

const { width } = Dimensions.get('window');
const STEPS = ['Itinéraire', 'Configuration', 'Validation'];

interface Station { arret: string; distance_km: number; }
interface Ligne { num_ligne: number | string; ville_depart: string; ville_arrivee: string; horaires: string[]; horaire?: string; stations: Station[]; }
interface TarifCfg { prix_par_km: number; frais_fixes: number; red_etudiant: number; red_pmr: number; }

const SEAT_ROWS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function VenteScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const numero_bus  = params.numero_bus as string;
  const service_id  = params.service_id as string;
  const num_ligne   = params.num_ligne as string;
  const ville_dep   = params.ville_depart as string;
  const station_actuelle = params.station_actuelle as string;
  const ville_arr   = params.ville_arrivee as string;
  const nom         = params.nom as string;
  const prenom      = params.prenom as string;
  const paramHoraire = params.horaire as string;
  const matricule   = params.matricule as string;
  const userId      = params.userId as string;

  const [ligne, setLigne]         = useState<Ligne | null>(null);
  const [tarifCfg, setTarifCfg]   = useState<TarifCfg | null>(null);
  const [occupied, setOccupied]   = useState<string[]>([]);
  const [busCapacite, setBusCapacite] = useState(50);
  const [loading, setLoading]     = useState(true);
  const [step, setStep]           = useState(0);

  const defaultHoraire = paramHoraire || (() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  })();
  const [horaire, setHoraire]         = useState(defaultHoraire);
  const [showHoraire, setShowHoraire] = useState(false);
  const [depart, setDepart]           = useState(station_actuelle || ville_dep || '');
  const [showDepart, setShowDepart]   = useState(false);
  const [arrivee, setArrivee]         = useState('');
  const [showArrivee, setShowArrivee] = useState(false);

  const [tarifsDb, setTarifsDb] = useState<any[]>([]);
  const [bagagesDb, setBagagesDb] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('VOYAGEUR');
  const [selectedTarifId, setSelectedTarifId] = useState('');
  const [selectedBagageId, setSelectedBagageId] = useState('');
  const [selectedSeat, setSeat]     = useState<string | null>(null);

  const [selling, setSelling]   = useState(false);
  const [ticketModal, setModal] = useState(false);
  const [lastTicket, setLastTicket] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [netRes, tarifRes, tRes, bRes, busRes] = await Promise.all([
          axios.get<Ligne[]>(NETWORK_API),
          axios.get<TarifCfg>(TARIFS_API),
          axios.get<any[]>(TARIFICATION_API),
          axios.get<any[]>(`${TARIFICATION_API}/bagages`),
          axios.get(`${API_BASE_URL}/api/buses/details/${numero_bus}`).catch(() => ({ data: { capacite: 50 } }))
        ]);
        const found = netRes.data.find(l => String(l.num_ligne) === String(num_ligne));
        setLigne(found ?? null);
        setTarifCfg(tarifRes.data);
        setBusCapacite(busRes.data?.capacite ? parseInt(busRes.data.capacite) : 50);
        
        if (tRes.data && Array.isArray(tRes.data)) {
            const active = tRes.data.filter((t: any) => t.actif);
            setTarifsDb(active);
            const voyageurs = active.filter((t: any) => t.categorie === 'VOYAGEUR');
            if(voyageurs.length > 0) setSelectedTarifId(voyageurs[0].id_type_tarification.toString());
        }
        if (bRes.data && Array.isArray(bRes.data)) {
            setBagagesDb(bRes.data.filter((b: any) => b.actif));
        }
      } catch (err) {
        console.error("Vente load error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (num_ligne) load(); else setLoading(false);
  }, [num_ligne]);

  useFocusEffect(useCallback(() => {
    if (!paramHoraire) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setHoraire(timeStr);
    }
  }, [paramHoraire]));

  useEffect(() => {
    if (!horaire || !num_ligne || !depart || !arrivee) return;
    const today = new Date().toISOString().split('T')[0];
    axios.get<string[]>(`${SALES_API}/tickets/occupied-seats?num_ligne=${num_ligne}&date=${today}&heure=${horaire}&depart=${encodeURIComponent(depart)}&arrivee=${encodeURIComponent(arrivee)}`)
      .then(r => setOccupied(r.data))
      .catch(() => setOccupied([]));
    setSeat(null);
  }, [horaire, depart, arrivee, num_ligne]);

  const stations = useMemo<Station[]>(() => {
    if (!ligne) return [];
    let list = [...(ligne.stations || [])];
    const startName = (ligne.ville_depart ?? '').trim().toLowerCase();
    if (!list.some(s => (s.arret || '').trim().toLowerCase() === startName)) {
      list.push({ arret: ligne.ville_depart, distance_km: 0 });
    }
    list.sort((a, b) => a.distance_km - b.distance_km);
    const unique: Station[] = [];
    const seen = new Set();
    for (const s of list) {
      const name = (s.arret || '').trim().toLowerCase();
      if (!seen.has(name)) { seen.add(name); unique.push(s); }
    }
    return params.isReversed === 'true' ? [...unique].reverse() : unique;
  }, [ligne, params.isReversed]);

  const deptSt  = stations.find(s => s.arret === depart);
  const deptIdx = stations.findIndex(s => s.arret === depart);
  const arrSt   = stations.find(s => s.arret === arrivee);
  const distance = deptSt && arrSt ? Math.abs(arrSt.distance_km - deptSt.distance_km) : 0;
  const arriveeOptions = deptIdx >= 0 ? stations.slice(deptIdx + 1) : [];

  const currentTarif = tarifsDb.find(t => String(t.id_type_tarification) === String(selectedTarifId));
  const currentBagage = bagagesDb.find(b => String(b.id_type_bagage) === String(selectedBagageId));

  const prix = useMemo(() => {
    if (!tarifCfg || distance <= 0 || !currentTarif) return 0;
    let basePrice = distance * tarifCfg.prix_par_km + parseFloat(tarifCfg.frais_fixes.toString());
    let total = 0;
    if (currentTarif.mode_calcul === 'PERCENT_RESTANT') total = basePrice * (currentTarif.valeur / 100);
    else if (currentTarif.mode_calcul === 'FIXE') total = parseFloat(currentTarif.valeur.toString()) / 1000;
    if (currentBagage) total += parseFloat(currentBagage.prix.toString()) / 1000;
    return Math.max(0, total);
  }, [tarifCfg, distance, currentTarif, currentBagage]);

  const horaires: string[] = ligne?.horaires?.filter(Boolean) ?? (ligne?.horaire ? [ligne.horaire] : []);
  const step0Valid = !!horaire && !!depart && !!arrivee;
  const step1Valid = !!selectedSeat;

  const renderSeats = () => {
    const numRows = Math.ceil(busCapacite / 4);
    const rows = [];
    let seatCount = 0;

    for (let i = 0; i < Math.min(numRows, SEAT_ROWS.length); i++) {
      if (seatCount >= busCapacite) break;
      const rowLabel = SEAT_ROWS[i];
      const colsInThisRow = Math.min(4, busCapacite - seatCount);
      const cells = [];

      for (let c = 1; c <= colsInThisRow; c++) {
        const id = `${rowLabel}${c}`;
        const occ = occupied.includes(id);
        const sel = selectedSeat === id;
        cells.push(
          <TouchableOpacity
            key={id}
            style={[
              styles.seat,
              occ ? styles.seatOcc : sel ? styles.seatSel : styles.seatFree,
              c === 2 && colsInThisRow > 2 && { marginRight: 36 } // Aisle Gap
            ]}
            onPress={() => !occ && setSeat(sel ? null : id)}
            disabled={occ}
          >
            <Text style={[styles.seatTxt, occ ? styles.seatTxtOcc : sel ? styles.seatTxtSel : styles.seatTxtFree]}>{id}</Text>
          </TouchableOpacity>
        );
      }
      seatCount += colsInThisRow;
      rows.push(<View key={rowLabel} style={styles.seatRow}>{cells}</View>);
    }
    return rows;
  };

  const handleSell = async () => {
    if (!selectedSeat || !depart || !arrivee || !horaire) return;
    setSelling(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const payload = {
        num_ligne, bus: numero_bus, date_voyage: today, heure: horaire, siege: selectedSeat,
        prix, arret_depart: depart, arret_arrivee: arrivee, agent_id: userId ? parseInt(userId) : null, 
        type_tarif: currentTarif ? currentTarif.libelle : 'Tarif Normal',
        id_type_tarification: currentTarif ? currentTarif.id_type_tarification : null,
        id_type_bagage: currentBagage ? currentBagage.id_type_bagage : null,
        prix_bagage: currentBagage ? parseFloat(currentBagage.prix) / 1000 : 0,
        id_service: service_id ? parseInt(service_id) : null,
      };
      const r = await axios.post<any>(`${SALES_API}/tickets/vendre`, payload);
      setOccupied(prev => [...prev, selectedSeat]);
      const basePrice = distance * (tarifCfg?.prix_par_km || 0) + parseFloat(tarifCfg?.frais_fixes?.toString() || '0');
      setLastTicket({
        ...payload, 
        id_ticket: r.data?.id_ticket,
        code_ticket: r.data?.code_ticket, 
        montant_total: prix, 
        station_depart: depart, 
        station_arrivee: arrivee, 
        heure_depart: horaire,
        date_emission: new Date().toISOString(), 
        numero_bus, 
        num_ligne, 
        matricule,
        distance,
        base_price: basePrice,
        ligne_full: ligne ? `${ligne.ville_depart} - ${ligne.ville_arrivee}` : `Ligne ${num_ligne}`
      });
      setModal(true);
      setSeat(null); 
      setDepart(station_actuelle || ville_dep || ''); 
      setArrivee(''); 
      setStep(0);
    } catch (err: any) {
      Alert.alert('Erreur', err.response?.data?.message || 'Impossible d\'émettre le billet');
    } finally { setSelling(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* ── Steps Bar ── */}
      <View style={styles.stepsContainer}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepCircle, i < step && styles.stepDone, i === step && styles.stepActive]}>
              {i < step ? <CheckCircle color={Colors.white} size={14} /> : <Text style={[styles.stepText, i === step && styles.stepTextActive]}>{i + 1}</Text>}
            </View>
            <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{s}</Text>
            {i < STEPS.length - 1 && <View style={[styles.stepLine, i < step && styles.stepLineDone]} />}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ══ STEP 0: ITINÉRAIRE ══ */}
        {step === 0 && (
          <View style={styles.formSection}>
            <View style={styles.infoBanner}>
              <Bus color={Colors.primary} size={18} strokeWidth={2.5} />
              <Text style={styles.bannerTxt}>Service #{service_id || 'Autonome'} · Bus {numero_bus}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>HORAIRE DE DÉPART</Text>
              <TouchableOpacity style={styles.pickerField} onPress={() => { setShowHoraire(!showHoraire); setShowDepart(false); }}>
                <Clock color={Colors.primary} size={18} strokeWidth={2.5} />
                <Text style={styles.pickerValue}>{horaire || 'Choisir l\'horaire'}</Text>
                <ChevronDown color={Colors.textMuted} size={18} />
              </TouchableOpacity>
              {showHoraire && (
                <View style={styles.dropdown}>
                  {horaires.map(h => (
                    <TouchableOpacity key={h} style={[styles.ddItem, horaire === h && styles.ddItemActive]} onPress={() => { setHoraire(h); setShowHoraire(false); }}>
                      <Text style={[styles.ddItemTxt, horaire === h && styles.ddItemTxtActive]}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>POINT DE MONTÉE</Text>
              <TouchableOpacity 
                style={[styles.pickerField, !!station_actuelle && styles.pickerDisabled]} 
                disabled={!!station_actuelle}
                onPress={() => { setShowDepart(!showDepart); setShowHoraire(false); }}
              >
                <MapPin color={Colors.success} size={18} strokeWidth={2.5} />
                <Text style={styles.pickerValue}>{depart || 'Sélectionner l\'arrêt'}</Text>
                { !station_actuelle && <ChevronDown color={Colors.textMuted} size={18} /> }
              </TouchableOpacity>
              {showDepart && (
                <View style={styles.dropdown}>
                  {stations.map(s => (
                    <TouchableOpacity key={s.arret} style={[styles.ddItem, depart === s.arret && styles.ddItemActive]} onPress={() => { setDepart(s.arret); setArrivee(''); setShowDepart(false); }}>
                      <Text style={[styles.ddItemTxt, depart === s.arret && styles.ddItemTxtActive]}>{s.arret}</Text>
                      <Text style={styles.ddItemKm}>{s.distance_km} km</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>DESTINATION</Text>
              <TouchableOpacity style={[styles.pickerField, !depart && styles.pickerDisabled]} disabled={!depart} onPress={() => setShowArrivee(!showArrivee)}>
                <MapPin color={Colors.danger} size={18} strokeWidth={2.5} />
                <Text style={styles.pickerValue}>{arrivee || 'Terminus'}</Text>
                <ChevronDown color={Colors.textMuted} size={18} />
              </TouchableOpacity>
              {showArrivee && (
                <View style={styles.dropdown}>
                  {arriveeOptions.map(s => (
                    <TouchableOpacity key={s.arret} style={[styles.ddItem, arrivee === s.arret && styles.ddItemActive]} onPress={() => { setArrivee(s.arret); setShowArrivee(false); }}>
                      <Text style={[styles.ddItemTxt, arrivee === s.arret && styles.ddItemTxtActive]}>{s.arret}</Text>
                      <Text style={styles.ddItemKm}>{s.distance_km} km</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity style={[styles.mainBtn, !step0Valid && styles.btnDis]} disabled={!step0Valid} onPress={() => setStep(1)}>
              <Text style={styles.mainBtnTxt}>Continuer</Text>
              <ChevronRight color={Colors.primary} size={20} strokeWidth={3} />
            </TouchableOpacity>
          </View>
        )}

        {/* ══ STEP 1: CONFIGURATION ══ */}
        {step === 1 && (
          <View style={styles.formSection}>
            <View style={styles.itinerarySummary}>
              <View style={styles.itineraryLine}>
                <View style={[styles.itDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.itCity}>{depart}</Text>
                <View style={styles.itArrow} />
                <Text style={styles.itCity}>{arrivee}</Text>
                <View style={[styles.itDot, { backgroundColor: Colors.danger }]} />
              </View>
              <Text style={styles.itDetails}>{distance.toFixed(1)} km · {horaire}</Text>
            </View>

            <Text style={styles.sectionLabel}>SÉLECTION DU TARIF</Text>
            <View style={styles.categoryTabs}>
              {['VOYAGEUR', 'CONVENTION', 'EXPEDITION'].map(cat => (
                <TouchableOpacity key={cat} style={[styles.catTab, selectedCategory === cat && styles.catTabActive]} onPress={() => { setSelectedCategory(cat); const ops = tarifsDb.filter(t => t.categorie === cat); if(ops.length > 0) setSelectedTarifId(ops[0].id_type_tarification.toString()); }}>
                  <Text style={[styles.catTabText, selectedCategory === cat && styles.catTabTextActive]}>{cat.charAt(0) + cat.slice(1).toLowerCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tarifScroll}>
              {tarifsDb.filter(t => t.categorie === selectedCategory).map(t => (
                <TouchableOpacity key={t.id_type_tarification} style={[styles.tarifOption, selectedTarifId == t.id_type_tarification && styles.tarifOptionActive]} onPress={() => setSelectedTarifId(t.id_type_tarification.toString())}>
                  <Text style={[styles.tarifOptLabel, selectedTarifId == t.id_type_tarification && styles.tarifOptLabelActive]}>{t.libelle}</Text>
                  <Text style={styles.tarifOptVal}>{t.mode_calcul === 'PERCENT_RESTANT' ? `${t.valeur}%` : `${(t.valeur/1000).toFixed(1)} DT`}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionLabel}>OPTIONS SUPPLÉMENTAIRES</Text>
            <View style={styles.optionGrid}>
              <TouchableOpacity style={[styles.optCard, !selectedBagageId && styles.optCardActive]} onPress={() => setSelectedBagageId('')}>
                <ShoppingBag color={!selectedBagageId ? Colors.primary : Colors.textMuted} size={18} />
                <Text style={[styles.optText, !selectedBagageId && styles.optTextActive]}>Sans Bagage</Text>
              </TouchableOpacity>
              {bagagesDb.map(b => (
                <TouchableOpacity key={b.id_type_bagage} style={[styles.optCard, selectedBagageId == b.id_type_bagage && styles.optCardActive]} onPress={() => setSelectedBagageId(b.id_type_bagage.toString())}>
                  <ShoppingBag color={selectedBagageId == b.id_type_bagage ? Colors.primary : Colors.textMuted} size={18} />
                  <Text style={[styles.optText, selectedBagageId == b.id_type_bagage && styles.optTextActive]}>{b.libelle}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>PLAN DES SIÈGES</Text>
            <View style={styles.seatContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10 }}>
                <View style={styles.seatGrid}>{renderSeats()}</View>
              </ScrollView>
              <View style={styles.seatLegend}>
                 <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.bgMid }]} /><Text style={styles.legendLbl}>Libre</Text></View>
                 <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.primary }]} /><Text style={styles.legendLbl}>Choisi</Text></View>
                 <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.border }]} /><Text style={styles.legendLbl}>Occupé</Text></View>
              </View>
            </View>

            <View style={styles.footerNav}>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(0)}>
                <ChevronLeft color={Colors.textMuted} size={24} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.mainBtn, { flex: 1 }, !step1Valid && styles.btnDis]} disabled={!step1Valid} onPress={() => setStep(2)}>
                <Text style={styles.mainBtnTxt}>Vérifier le billet</Text>
                <ChevronRight color={Colors.primary} size={20} strokeWidth={3} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ══ STEP 2: VALIDATION ══ */}
        {step === 2 && (
          <View style={styles.formSection}>
            <View style={styles.ticketRecap}>
              <View style={styles.recapHeader}>
                <Ticket color={Colors.primary} size={28} strokeWidth={2.5} />
                <View>
                  <Text style={styles.recapTitle}>Billet de Voyage</Text>
                  <Text style={styles.recapSubtitle}>LIGNE {num_ligne}</Text>
                </View>
              </View>
              
              <View style={styles.recapDivider} />
              
              <View style={styles.recapGrid}>
                <View style={styles.recapField}>
                  <Text style={styles.rfLabel}>PASSAGER / TARIF</Text>
                  <Text style={styles.rfValue}>{currentTarif?.libelle || 'Standard'}</Text>
                </View>
                <View style={styles.recapField}>
                  <Text style={styles.rfLabel}>UNITÉ BUS</Text>
                  <Text style={styles.rfValue}>{numero_bus}</Text>
                </View>
                <View style={styles.recapField}>
                  <Text style={styles.rfLabel}>SIÈGE RÉSERVÉ</Text>
                  <Text style={[styles.rfValue, { color: Colors.primary, fontSize: 20 }]}>{selectedSeat}</Text>
                </View>
                <View style={styles.recapField}>
                  <Text style={styles.rfLabel}>HEURE DÉPART</Text>
                  <Text style={styles.rfValue}>{horaire}</Text>
                </View>
              </View>

              <View style={styles.recapPath}>
                <View style={styles.pathNode}>
                  <View style={[styles.pDot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.pCity}>{depart}</Text>
                </View>
                <View style={styles.pathLine} />
                <View style={styles.pathNode}>
                  <View style={[styles.pDot, { backgroundColor: Colors.danger }]} />
                  <Text style={styles.pCity}>{arrivee}</Text>
                </View>
              </View>

              <View style={styles.totalBlock}>
                <Text style={styles.totalLabel}>MONTANT TOTAL</Text>
                <Text style={styles.totalValue}>{prix.toFixed(3)} <Text style={styles.totalCurrency}>TND</Text></Text>
              </View>
            </View>

            <View style={styles.footerNav}>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                <ChevronLeft color={Colors.textMuted} size={24} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sellBtn, selling && styles.btnDis]} disabled={selling} onPress={handleSell}>
                {selling ? <ActivityIndicator color={Colors.white} /> : <><Printer color={Colors.white} size={20} strokeWidth={2.5} /><Text style={styles.sellBtnTxt}>Confirmer & Imprimer</Text></>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Ticket Success Modal ── */}
      <Modal visible={ticketModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.ticketScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.officialTicket}>
              <Text style={styles.ticketLogo}>TuniMove</Text>
              
              <View style={styles.ticketGrid}>
                <View style={styles.tRow}><Text style={styles.tLbl}>N° Ticket:</Text><Text style={styles.tVal}>T{String(lastTicket?.id_ticket || '0').padStart(3, '0')}</Text></View>
                <View style={styles.tRow}><Text style={styles.tLbl}>Receveur:</Text><Text style={styles.tVal}>{lastTicket?.matricule || '---'}</Text></View>
                <View style={styles.tRow}><Text style={styles.tLbl}>Bus:</Text><Text style={styles.tVal}>N° {lastTicket?.numero_bus}</Text></View>
                <View style={styles.tRow}><Text style={styles.tLbl}>Ligne:</Text><Text style={styles.tVal}>{lastTicket?.ligne_full}</Text></View>
                <View style={styles.tRow}><Text style={styles.tLbl}>Départ:</Text><Text style={styles.tVal}>{lastTicket?.station_depart}</Text></View>
                <View style={styles.tRow}><Text style={styles.tLbl}>Arrivée:</Text><Text style={styles.tVal}>{lastTicket?.station_arrivee}</Text></View>
                <View style={styles.tRow}><Text style={styles.tLbl}>Date:</Text><Text style={styles.tVal}>{lastTicket ? new Date(lastTicket.date_voyage).toLocaleDateString('fr-FR') : ''}</Text></View>
                <View style={styles.tRow}><Text style={styles.tLbl}>Heure:</Text><Text style={styles.tVal}>{lastTicket?.heure_depart}</Text></View>
                <View style={styles.tRow}><Text style={styles.tLbl}>Siège:</Text><Text style={styles.tVal}>{lastTicket?.siege}</Text></View>
                <View style={styles.tRow}><Text style={styles.tLbl}>Distance:</Text><Text style={styles.tVal}>{lastTicket?.distance?.toFixed(0)} km</Text></View>
                <View style={styles.tRow}><Text style={styles.tLbl}>Type Tarif:</Text><Text style={styles.tVal}>{lastTicket?.type_tarif}</Text></View>
              </View>

              <View style={styles.tDividerDashed} />

              <View style={styles.tPriceRow}>
                <Text style={styles.tPriceLbl}>Prix de base:</Text>
                <Text style={styles.tPriceVal}>{lastTicket?.base_price?.toFixed(3)} TND</Text>
              </View>

              <Text style={styles.tGrandTotal}>{lastTicket?.montant_total?.toFixed(3)} TND</Text>

              <View style={styles.tQrBox}>
                <QRCode value={lastTicket?.code_ticket || 'TKT-000'} size={150} color="#000" />
              </View>

              <View style={styles.tDividerSolid} />

              <Text style={styles.tFooterAgent}>Receveur: {prenom} {nom}</Text>
              <Text style={styles.tFooterWish}>Bon Voyage !</Text>
            </View>

            <TouchableOpacity style={styles.ticketDoneBtn} onPress={() => { setModal(false); setStep(0); }}>
              <Text style={styles.ticketDoneBtnText}>Terminer</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgLight },
  
  // Steps Bar
  stepsContainer: { flexDirection: 'row', backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 15, alignItems: 'center', justifyContent: 'space-between' },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  stepActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  stepDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  stepText: { fontSize: 12, fontWeight: '900', color: 'rgba(255, 255, 255, 0.4)' },
  stepTextActive: { color: Colors.primary },
  stepLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255, 255, 255, 0.3)', letterSpacing: 0.5 },
  stepLabelActive: { color: Colors.white },
  stepLine: { width: 15, height: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 1 },
  stepLineDone: { backgroundColor: Colors.success },

  scrollContent: { paddingBottom: 60, backgroundColor: Colors.bgLight, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, minHeight: '100%' },
  formSection: { padding: Spacing.xl },

  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.primary + '10', padding: 14, borderRadius: Radius.lg, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.primary + '15' },
  bannerTxt: { fontSize: 14, fontWeight: '800', color: Colors.primary },

  inputGroup: { marginBottom: Spacing.xl },
  inputLabel: { fontSize: 11, fontWeight: '900', color: Colors.textLight, letterSpacing: 1.5, marginBottom: 8 },
  pickerField: { height: 56, backgroundColor: Colors.white, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12, ...Shadow.card, borderWidth: 1, borderColor: Colors.bgMid },
  pickerDisabled: { opacity: 0.5 },
  pickerValue: { flex: 1, fontSize: 16, fontWeight: '800', color: Colors.textDark },
  
  dropdown: { marginTop: 8, backgroundColor: Colors.white, borderRadius: Radius.xl, overflow: 'hidden', ...Shadow.strong, borderWidth: 1, borderColor: Colors.bgMid },
  ddItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.bgMid },
  ddItemActive: { backgroundColor: Colors.primary + '05' },
  ddItemTxt: { fontSize: 16, fontWeight: '700', color: Colors.textMid },
  ddItemTxtActive: { color: Colors.primary, fontWeight: '900' },
  ddItemKm: { fontSize: 13, color: Colors.textLight, fontWeight: '800' },

  mainBtn: { backgroundColor: Colors.accent, height: 60, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, ...Shadow.accent },
  mainBtnTxt: { fontSize: 18, fontWeight: '900', color: Colors.primary, letterSpacing: -0.3 },
  btnDis: { opacity: 0.5 },

  // Step 1
  itinerarySummary: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.xl, ...Shadow.card, borderWidth: 1, borderColor: Colors.bgMid },
  itineraryLine: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center' },
  itDot: { width: 8, height: 8, borderRadius: 4 },
  itCity: { fontSize: 16, fontWeight: '900', color: Colors.textDark },
  itArrow: { flex: 1, height: 2, backgroundColor: Colors.bgMid, marginHorizontal: 4 },
  itDetails: { fontSize: 13, color: Colors.textLight, fontWeight: '800', textAlign: 'center', marginTop: 8, letterSpacing: 0.5 },

  sectionLabel: { fontSize: 12, fontWeight: '900', color: Colors.textLight, letterSpacing: 1.5, marginBottom: 12, marginTop: 8 },
  categoryTabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  catTab: { flex: 1, height: 40, borderRadius: Radius.pill, backgroundColor: Colors.bgMid, alignItems: 'center', justifyContent: 'center' },
  catTabActive: { backgroundColor: Colors.primary },
  catTabText: { fontSize: 13, fontWeight: '900', color: Colors.textMuted },
  catTabTextActive: { color: Colors.white },

  tarifScroll: { gap: 10, paddingVertical: 4 },
  tarifOption: { minWidth: 100, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 14, alignItems: 'center', gap: 4, ...Shadow.subtle, borderWidth: 1, borderColor: Colors.bgMid },
  tarifOptionActive: { borderColor: Colors.success, backgroundColor: Colors.success + '08' },
  tarifOptLabel: { fontSize: 13, fontWeight: '900', color: Colors.textMid },
  tarifOptLabelActive: { color: Colors.success },
  tarifOptVal: { fontSize: 14, fontWeight: '800', color: Colors.textLight },

  optionGrid: { flexDirection: 'row', gap: 10, marginBottom: Spacing.xl },
  optCard: { flex: 1, height: 70, backgroundColor: Colors.white, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', gap: 6, ...Shadow.subtle, borderWidth: 1, borderColor: Colors.bgMid },
  optCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  optText: { fontSize: 12, fontWeight: '800', color: Colors.textMuted },
  optTextActive: { color: Colors.primary, fontWeight: '900' },

  seatContainer: { backgroundColor: Colors.white, borderRadius: Radius.xl, paddingVertical: 20, ...Shadow.subtle, borderWidth: 1, borderColor: Colors.bgMid, marginBottom: Spacing.xl },
  seatGrid: { gap: 8, alignItems: 'center' },
  seatRow: { flexDirection: 'row', gap: 8 },
  seat: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  seatFree: { backgroundColor: Colors.bgMid, borderColor: Colors.divider },
  seatSel: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  seatOcc: { backgroundColor: Colors.border, borderColor: Colors.border },
  seatTxt: { fontSize: 13, fontWeight: '800' },
  seatTxtFree: { color: Colors.textMuted },
  seatTxtSel: { color: Colors.white },
  seatTxtOcc: { color: Colors.textLight },
  seatLegend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendLbl: { fontSize: 11, fontWeight: '800', color: Colors.textLight },

  footerNav: { flexDirection: 'row', gap: 12, marginTop: 10 },
  backButton: { width: 60, height: 60, borderRadius: Radius.xl, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', ...Shadow.subtle, borderWidth: 1, borderColor: Colors.bgMid },

  // Step 2
  ticketRecap: { backgroundColor: Colors.white, borderRadius: Radius.xxl, padding: Spacing.xl, ...Shadow.strong, borderWidth: 1, borderColor: Colors.bgMid },
  recapHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  recapTitle: { fontSize: 22, fontWeight: '900', color: Colors.textDark, letterSpacing: -0.5 },
  recapSubtitle: { fontSize: 13, color: Colors.textLight, fontWeight: '800', letterSpacing: 1 },
  recapDivider: { height: 1, backgroundColor: Colors.bgMid, marginVertical: Spacing.xl },
  recapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20 },
  recapField: { width: '45%' },
  rfLabel: { fontSize: 10, fontWeight: '900', color: Colors.textLight, letterSpacing: 1, marginBottom: 4 },
  rfValue: { fontSize: 16, fontWeight: '800', color: Colors.textDark },
  recapPath: { marginTop: Spacing.xl, gap: 10 },
  pathNode: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pDot: { width: 10, height: 10, borderRadius: 5 },
  pCity: { fontSize: 17, fontWeight: '900', color: Colors.textDark },
  pathLine: { width: 2, height: 24, backgroundColor: Colors.bgMid, marginLeft: 4 },
  totalBlock: { marginTop: Spacing.xxl, backgroundColor: Colors.primary, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center' },
  totalLabel: { fontSize: 12, fontWeight: '900', color: 'rgba(255, 255, 255, 0.4)', letterSpacing: 2 },
  totalValue: { fontSize: 32, fontWeight: '900', color: Colors.white, marginTop: 4 },
  totalCurrency: { fontSize: 18, color: Colors.accent },

  sellBtn: { flex: 1, backgroundColor: Colors.primary, height: 64, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, ...Shadow.strong },
  sellBtnTxt: { fontSize: 18, fontWeight: '900', color: Colors.white, letterSpacing: -0.3 },

  // Official Ticket Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center' },
  ticketScroll: { paddingVertical: 40, paddingHorizontal: 20, alignItems: 'center' },
  officialTicket: {
    backgroundColor: Colors.white,
    width: '100%',
    maxWidth: 340,
    padding: 24,
    borderWidth: 2,
    borderColor: '#000',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  ticketLogo: { fontSize: 28, fontWeight: '900', color: '#000', marginBottom: 20, textAlign: 'center' },
  ticketGrid: { width: '100%', gap: 6 },
  tRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tLbl: { fontSize: 13, fontWeight: '700', color: '#000', flex: 0.4 },
  tVal: { fontSize: 13, fontWeight: '900', color: '#000', flex: 0.6, textAlign: 'right' },
  
  tDividerDashed: { width: '100%', height: 1, borderBottomWidth: 1, borderColor: '#000', borderStyle: 'dashed', marginVertical: 15 },
  
  tPriceRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  tPriceLbl: { fontSize: 11, fontWeight: '700', color: '#000' },
  tPriceVal: { fontSize: 11, fontWeight: '900', color: '#000' },
  
  tGrandTotal: { fontSize: 24, fontWeight: '900', color: '#000', marginVertical: 10, textAlign: 'center' },
  
  tQrBox: { marginVertical: 15, padding: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' },
  
  tDividerSolid: { width: '100%', height: 1, backgroundColor: '#eee', marginVertical: 15 },
  
  tFooterAgent: { fontSize: 12, fontWeight: '700', color: '#000', textAlign: 'center', textTransform: 'capitalize' },
  tFooterWish: { fontSize: 12, fontWeight: '700', color: '#000', textAlign: 'center', marginTop: 4 },
  
  ticketDoneBtn: { backgroundColor: Colors.accent, width: '100%', maxWidth: 340, height: 60, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', marginTop: 20, ...Shadow.accent },
  ticketDoneBtnText: { fontSize: 18, fontWeight: '900', color: Colors.primary },
});
