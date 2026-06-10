import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.tsx";
import {
    Button,
    Card,
    Separator,
    Dropdown,
    Label,
    Form,
    Spinner,
    Alert
} from "@heroui/react";
import { ReadOnlyField } from "../components/ReadOnlyField.jsx";
import { today, getLocalTimeZone } from "@internationalized/date";
import { ThumbsUp, Save, Pencil, X, ChevronLeft, Plus, ChevronDown, ThumbsDown, Star, Heart, Route, Info, Bath, PersonStanding, Footprints, Utensils, House, MessagesSquare, Hand, Cross, ScrollText, UserRound, Phone, Calendar, User, Trash2 } from "lucide-react";
import { useIndividualPlan } from "../hooks/useIndividualPlan.jsx";
import { useClients } from "../hooks/useClients.jsx";
import { showToast } from "../components/MyToast.jsx";
import { BackToTopButton } from "../components/BackToTopButton.jsx";
import { DailyRecordCreateModal } from "../components/modals/individualPlan/DailyRecordCreateModal.jsx";
import { DailyRecordDeleteModal } from "../components/modals/individualPlan/DailyRecordDeleteModal.jsx";
import {formatDate} from "../utils/formatters.js";
import {benefitsOptions} from "../constants/clientConstants.js";
import {useIsMobile} from "../hooks/useMediaQuery.js";
import {ImageUpload} from "../components/ImageUpload.jsx";

function IndividualPlan() {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isMobile = useIsMobile();

    const { fetchClient } = useClients();

    const {
        versions,
        individualPlan,
        currentContent,
        loading,
        fetchIndividualPlan,
        fetchVersions,
        fetchIndividualPlanByVersion,
        createIndividualPlan,
        updateIndividualPlan,
        addDailyRecord,
        removeDailyRecord,
        reset
    } = useIndividualPlan();

    const [client, setClient] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedVersionNumber, setSelectedVersionNumber] = useState(null);
    const [isDailyRecordModalOpen, setIsDailyRecordModalOpen] = useState(false);
    const [isDailyRecordDeleteModalOpen, setIsDailyRecordDeleteModalOpen] = useState(false);
    const [selectedDailyRecordId, setSelectedDailyRecordId] = useState(null);
    const hasShownPermissionToast = React.useRef(false);

    // Form state
    const [processedDate, setProcessedDate] = useState("");
    const [plannedUpdateDate, setPlannedUpdateDate] = useState("");
    const [likes, setLikes] = useState("");
    const [dislikes, setDislikes] = useState("");
    const [strengths, setStrengths] = useState("");
    const [aspirations, setAspirations] = useState("");
    const [lifePath, setLifePath] = useState("");
    const [additionalInfo, setAdditionalInfo] = useState("");
    const [hygiene, setHygiene] = useState("");
    const [selfCare, setSelfCare] = useState("");
    const [mobility, setMobility] = useState("");
    const [diet, setDiet] = useState("");
    const [homeCare, setHomeCare] = useState("");
    const [socialContact, setSocialContact] = useState("");
    const [activities, setActivities] = useState("");
    const [health, setHealth] = useState("");
    const [exercisingRights, setExercisingRights] = useState("");

    const [errors, setErrors] = useState({});

    // Helper function to initialize form from content
    const initializeFormFromContent = (content) => {
        if (!content) return;

        setProcessedDate(content.processedDate || "");
        setPlannedUpdateDate(content.plannedUpdateDate || "");
        setLikes(content.likes || "");
        setDislikes(content.dislikes || "");
        setStrengths(content.strengths || "");
        setAspirations(content.aspirations || "");
        setLifePath(content.lifePath || "");
        setAdditionalInfo(content.additionalInfo || "");
        setHygiene(content.hygiene || "");
        setSelfCare(content.selfCare || "");
        setMobility(content.mobility || "");
        setDiet(content.diet || "");
        setHomeCare(content.homeCare || "");
        setSocialContact(content.socialContact || "");
        setActivities(content.activities || "");
        setHealth(content.health || "");
        setExercisingRights(content.exercisingRights || "");
    };

    useEffect(() => {
        async function loadData() {
            try {
                const clientData = await fetchClient(clientId);
                setClient(clientData);

                const plan = await fetchIndividualPlan(clientId);

                if (plan) {
                    await fetchVersions(clientId);

                    if (plan.currentContent) {
                        setSelectedVersionNumber(plan.currentContent.versionNumber);
                    }
                } else {
                    const isCaregiver = user && clientData && user.employeeId === clientData.caregiver?.id;
                    const isAdmin = user && ["SUPERADMIN", "ADMIN"].includes(user.role);

                    if (!isCaregiver && !isAdmin) {
                        // Show the permission toast only once to avoid duplicate toasts on re-renders
                        if (!hasShownPermissionToast.current) {
                            hasShownPermissionToast.current = true;
                            showToast({
                                title: "Nemáte oprávnění",
                                description: "Individuální plán může vytvořit pouze klíčový pracovník klienta.",
                                color: "warning"
                            });
                            navigate(-1);
                        }
                        return;
                    }

                    // No plan yet and user is authorized — auto-enter edit mode to create the first version
                    setIsEditMode(true);
                    setProcessedDate(today(getLocalTimeZone()).toString());
                    const sixMonthsLater = today(getLocalTimeZone()).add({ months: 6 });
                    setPlannedUpdateDate(sixMonthsLater.toString());
                }
            } catch (error) {
                console.error("Error loading data:", error);
            }
        }

        loadData();

        return () => reset();
    }, [clientId]);

    useEffect(() => {
        initializeFormFromContent(currentContent);
    }, [currentContent]);

    const handleVersionChange = async (versionNumber) => {
        const versionNum = parseInt(versionNumber);
        setSelectedVersionNumber(versionNum);
        setIsEditMode(false); // disable edit when browsing a historical version
        await fetchIndividualPlanByVersion(clientId, versionNum);
    };

    const handleEnterEditMode = () => {
        if (individualPlan?.currentContent && selectedVersionNumber !== individualPlan.currentContent.versionNumber) {
            setSelectedVersionNumber(individualPlan.currentContent.versionNumber);
            initializeFormFromContent(individualPlan.currentContent);
        } else if (currentContent) {
            initializeFormFromContent(currentContent);
        }

        // Always set fresh dates when entering edit mode — each save creates a new version
        setProcessedDate(today(getLocalTimeZone()).toString());
        const sixMonthsLater = today(getLocalTimeZone()).add({ months: 6 });
        setPlannedUpdateDate(sixMonthsLater.toString());

        setIsEditMode(true);
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setErrors({});

        if (currentContent) {
            initializeFormFromContent(currentContent);
        } else {
            navigate(-1);
        }
    };

    const validateForm = () => {
        return {};
    };

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setIsSubmitting(true);

        const formData = {
            processedDate,
            plannedUpdateDate,
            likes: likes || null,
            dislikes: dislikes || null,
            strengths: strengths || null,
            aspirations: aspirations || null,
            lifePath: lifePath || null,
            additionalInfo: additionalInfo || null,
            hygiene: hygiene || null,
            selfCare: selfCare || null,
            mobility: mobility || null,
            diet: diet || null,
            homeCare: homeCare || null,
            socialContact: socialContact || null,
            activities: activities || null,
            health: health || null,
            exercisingRights: exercisingRights || null,
        };

        try {
            if (individualPlan) {
                const updated = await updateIndividualPlan(clientId, formData);
                setSelectedVersionNumber(updated.currentContent.versionNumber);
            } else {
                const created = await createIndividualPlan(clientId, formData);
                setSelectedVersionNumber(created.currentContent.versionNumber);
            }
            setIsEditMode(false);
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddDailyRecord = async (dailyRecordData) => {
        try {
            await addDailyRecord(clientId, dailyRecordData);
            setIsDailyRecordModalOpen(false);
        } catch (error) {
            console.error("Error adding daily record:", error);
            throw error; // re-throw so the modal stays open on failure
        }
    };

    const handleOpenDeleteModal = (dailyRecordId) => {
        setSelectedDailyRecordId(dailyRecordId);
        setIsDailyRecordDeleteModalOpen(true);
    };

    const handleDeleteDailyRecord = async (dailyRecordId) => {
        try {
            await removeDailyRecord(clientId, dailyRecordId);
            setIsDailyRecordDeleteModalOpen(false);
            setSelectedDailyRecordId(null);
        } catch (error) {
            console.error("Error deleting daily record:", error);
            throw error;
        }
    };

    const canDeleteDailyRecord = (record) => {
        if (!user) return false;

        if (["SUPERADMIN", "ADMIN"].includes(user.role)) {
            return true;
        }

        // COORDINATOR and CAREGIVER can only delete records they created themselves
        return record.createdBy.id === user.employeeId;
    };

    const canEdit = user && client && (
        user.employeeId === client.caregiver?.id ||
        ["SUPERADMIN", "ADMIN"].includes(user.role)
    );

    const isViewingOldVersion = !isSubmitting && !loading &&
                                 selectedVersionNumber !== null &&
                                 individualPlan?.currentContent &&
                                 selectedVersionNumber !== individualPlan.currentContent.versionNumber;

    return (
        <div className="container mx-auto">
            {/* Header */}
            <div className="flex items-center align-middle justify-between pb-3">
                <Button
                    variant="tertiary"
                    onPress={() => navigate(-1)}
                ><ChevronLeft size={18} /> Zpět</Button>

                {!isMobile && (
                    <h1 className="text-center">Individuální plán</h1>
                )}

                {versions.length > 0 && !isEditMode ? (
                    <Dropdown>
                        <Button
                            variant="tertiary"
                        >{selectedVersionNumber
                                ? `Verze ${selectedVersionNumber}${
                                    selectedVersionNumber === individualPlan?.currentContent?.versionNumber
                                        ? ' (Aktuální)'
                                        : ''
                                  }`
                                : 'Vyberte verzi'
                            } <ChevronDown className="size-4" /></Button>
                        <Dropdown.Popover>
                            <Dropdown.Menu
                                disallowEmptySelection
                                aria-label="Výběr verze individuálního plánu"
                                selectedKeys={selectedVersionNumber ? [selectedVersionNumber.toString()] : []}
                                selectionMode="single"
                                onSelectionChange={(keys) => {
                                    const versionNum = Array.from(keys)[0];
                                    handleVersionChange(versionNum);
                                }}
                            >
                                {versions.map((v) => (
                                    <Dropdown.Item key={v.versionNumber.toString()} id={v.versionNumber.toString()} textValue={`Verze ${v.versionNumber}`}>
                                        <Dropdown.ItemIndicator />
                                        <Label>
                                            Verze {v.versionNumber} - {new Date(v.processedDate).toLocaleDateString('cs-CZ')}
                                            {v.versionNumber === individualPlan?.currentContent?.versionNumber && " (Aktuální)"}
                                        </Label>
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown>
                ) : (
                    <div />
                )}
            </div>

            {isMobile && (
                <h1 className="text-center py-3">Individuální plán</h1>
            )}

            {/* Loading */}
            {loading && !currentContent && (
                <div className="flex flex-col justify-center items-center py-12 gap-2">
                    <Spinner size="lg" />
                    <p className="text-sm text-foreground/60">Načítání individuálního plánu...</p>
                </div>
            )}

            <h2 className="my-4">
                Základní informace
            </h2>

            { client && client.pictureUrl && (
                <ImageUpload
                    value={client.pictureUrl}
                    isReadOnly
                    size={48}
                />
            )}

            <div className="flex flex-col gap-4 w-full mb-4">
                <div className="flex flex-row gap-2 w-full items-center mt-2">
                    <UserRound size={20}/>
                    <h4>Obecné informace</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <ReadOnlyField labelPlacement="outside" label="Jméno" value={client ? client.firstName : "-"} />
                    <ReadOnlyField labelPlacement="outside" label="Příjmení" value={client ? client.lastName : "-"} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <ReadOnlyField labelPlacement="outside" label="Datum narození" value={client ? formatDate(client.dateOfBirth) : "-"} />
                    <ReadOnlyField labelPlacement="outside" label="Od kdy využívá službu" value={client ? formatDate(client.created) : "-"} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <ReadOnlyField labelPlacement="outside" label="Středisko" value={client ? client.department?.city : "-"} />
                    <ReadOnlyField labelPlacement="outside" label="Klíčový pracovník" value={client?.caregiver?.fullName || "-"} />
                </div>
                <div className="flex flex-row gap-2 w-full items-center mt-2">
                    <House size={20}/>
                    <h4>Adresa bydliště</h4>
                </div>
                <ReadOnlyField labelPlacement="outside" label="Ulice a číslo popisné" value={client ? client.street : "-"} />
                <div className="grid grid-cols-2 gap-4">
                    <ReadOnlyField labelPlacement="outside" label="Město" value={client ? client.city : "-"} />
                    <ReadOnlyField labelPlacement="outside" label="PSČ" value={client ? client.postalCode : "-"} />
                </div>
                <div className="flex flex-row gap-2 w-full items-center mt-2">
                    <Phone size={20}/>
                    <h4>Kontakt na příbuzné</h4>
                </div>
                <ReadOnlyField labelPlacement="outside" value={client && client.relativesContact ? client.relativesContact : "-"} multiline={true} />
                <div className="flex flex-row gap-2 w-full items-center mt-2">
                    <Info size={20}/>
                    <h4>Doplňující informace</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <ReadOnlyField labelPlacement="outside" label="Příspěvek na péči" value={client ? benefitsOptions.find(b => b.key === client.benefits)?.name : "-"} />
                    <ReadOnlyField labelPlacement="outside" label="Omezení ve svéprávnosti" value={client ? client.legallyCompetent ? 'Ano' : 'Ne' : "-"} />
                </div>
            </div>

            {/* Content */}
            {!loading || currentContent ? (
                <Form className="space-y-4" validationErrors={errors} onSubmit={handleSubmit}>
                    <h2 className="mt-4">Osobní profil</h2>
                    <div className="space-y-4 w-full">
                        <div className="flex flex-row gap-2 w-full items-center mt-2">
                            <ThumbsUp size={20} />
                            <h4>Co mám rád/a, co mě baví, co je pro mě důležité</h4>
                        </div>
                        {isEditMode ? (
                            <textarea
                                name="likes"
                                value={likes}
                                onChange={(e) => setLikes(e.target.value)}
                                rows={3}
                                disabled={isSubmitting}
                                className="w-full rounded-md border border-default px-3 py-2 text-sm bg-default-100 outline-none focus:ring-1 focus:ring-primary transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                        ) : (
                            <ReadOnlyField labelPlacement="outside" value={likes} multiline={true} />
                        )}

                        <div className="flex flex-row gap-2 w-full items-center mt-2">
                            <ThumbsDown size={20} />
                            <h4>Co nemám rád/a, co mi vadí</h4>
                        </div>
                        {isEditMode ? (
                            <textarea
                                name="dislikes"
                                value={dislikes}
                                onChange={(e) => setDislikes(e.target.value)}
                                rows={3}
                                disabled={isSubmitting}
                                className="w-full rounded-md border border-default px-3 py-2 text-sm bg-default-100 outline-none focus:ring-1 focus:ring-primary transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                        ) : (
                            <ReadOnlyField labelPlacement="outside" value={dislikes} multiline={true} />
                        )}

                        <div className="flex flex-row gap-2 w-full items-center">
                            <Star size={20} />
                            <h4>Co na mě mají lidé rádi, mé silné stránky</h4>
                        </div>
                        {isEditMode ? (
                            <textarea
                                name="strengths"
                                value={strengths}
                                onChange={(e) => setStrengths(e.target.value)}
                                rows={3}
                                disabled={isSubmitting}
                                className="w-full rounded-md border border-default px-3 py-2 text-sm bg-default-100 outline-none focus:ring-1 focus:ring-primary transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                        ) : (
                            <ReadOnlyField labelPlacement="outside" value={strengths} multiline={true} />
                        )}

                        <div className="flex flex-row gap-2 w-full items-center">
                            <Heart size={20} />
                            <h4>Moje touhy, přání, sny</h4>
                        </div>
                        {isEditMode ? (
                            <textarea
                                name="aspirations"
                                value={aspirations}
                                onChange={(e) => setAspirations(e.target.value)}
                                rows={3}
                                disabled={isSubmitting}
                                className="w-full rounded-md border border-default px-3 py-2 text-sm bg-default-100 outline-none focus:ring-1 focus:ring-primary transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                        ) : (
                            <ReadOnlyField labelPlacement="outside" value={aspirations} multiline={true} />
                        )}

                        <div className="flex flex-row gap-2 w-full items-center">
                            <Route size={20} />
                            <h4>Životní cesta</h4>
                        </div>
                        {isEditMode ? (
                            <textarea
                                name="lifePath"
                                value={lifePath}
                                onChange={(e) => setLifePath(e.target.value)}
                                rows={4}
                                disabled={isSubmitting}
                                className="w-full rounded-md border border-default px-3 py-2 text-sm bg-default-100 outline-none focus:ring-1 focus:ring-primary transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                        ) : (
                            <ReadOnlyField labelPlacement="outside" value={lifePath} multiline={true} />
                        )}

                        <div className="flex flex-row gap-2 w-full items-center">
                            <Info size={20} />
                            <h4>Další důležité informace</h4>
                        </div>
                        {isEditMode ? (
                            <textarea
                                name="additionalInfo"
                                value={additionalInfo}
                                onChange={(e) => setAdditionalInfo(e.target.value)}
                                rows={3}
                                disabled={isSubmitting}
                                className="w-full rounded-md border border-default px-3 py-2 text-sm bg-default-100 outline-none focus:ring-1 focus:ring-primary transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                        ) : (
                            <ReadOnlyField labelPlacement="outside" value={additionalInfo} multiline={true} />
                        )}
                    </div>

                    <h2>Popis podpory</h2>
                    <div className="space-y-4 w-full">
                        <div className="flex flex-row gap-2 w-full items-center">
                            <Bath size={20} />
                            <h4>Osobní hygiena</h4>
                        </div>
                        {isEditMode ? (
                            <textarea
                                name="hygiene"
                                value={hygiene}
                                onChange={(e) => setHygiene(e.target.value)}
                                rows={3}
                                disabled={isSubmitting}
                                className="w-full rounded-md border border-default px-3 py-2 text-sm bg-default-100 outline-none focus:ring-1 focus:ring-primary transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                        ) : (
                            <ReadOnlyField labelPlacement="outside" value={hygiene} multiline={true} />
                        )}

                        <div className="flex flex-row gap-2 w-full items-center">
                            <PersonStanding size={20} />
                            <h4>Péče o vlastní osobu</h4>
                        </div>
                        {isEditMode ? (
                            <textarea
                                name="selfCare"
                                value={selfCare}
                                onChange={(e) => setSelfCare(e.target.value)}
                                rows={3}
                                disabled={isSubmitting}
                                className="w-full rounded-md border border-default px-3 py-2 text-sm bg-default-100 outline-none focus:ring-1 focus:ring-primary transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                        ) : (
                            <ReadOnlyField labelPlacement="outside" value={selfCare} multiline={true} />
                        )}

                        <div className="flex flex-row gap-2 w-full items-center">
                            <Footprints size={20} />
                            <h4>Samostatný pohyb</h4>
                        </div>
                        {isEditMode ? (
                            <textarea
                                name="mobility"
                                value={mobility}
                                onChange={(e) => setMobility(e.target.value)}
                                rows={3}
                                disabled={isSubmitting}
                                className="w-full rounded-md border border-default px-3 py-2 text-sm bg-default-100 outline-none focus:ring-1 focus:ring-primary transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                        ) : (
                            <ReadOnlyField labelPlacement="outside" value={mobility} multiline={true} />
                        )}

                        <div className="flex flex-row gap-2 w-full items-center">
                            <Utensils size={20} />
                            <h4>Stravování</h4>
                        </div>
                        {isEditMode ? (
                            <textarea
                                name="diet"
                                value={diet}
                                onChange={(e) => setDiet(e.target.value)}
                                rows={3}
                                disabled={isSubmitting}
                                className="w-full rounded-md border border-default px-3 py-2 text-sm bg-default-100 outline-none focus:ring-1 focus:ring-primary transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                        ) : (
                            <ReadOnlyField labelPlacement="outside" value={diet} multiline={true} />
                        )}

                        <div className="flex flex-row gap-2 w-full items-center">
                            <House size={20} />
                            <h4>Péče o domácnost nebo pokoj</h4>
                        </div>
                        {isEditMode ? (
                            <textarea
                                name="homeCare"
                                value={homeCare}
                                onChange={(e) => setHomeCare(e.target.value)}
                                rows={3}
                                disabled={isSubmitting}
                                className="w-full rounded-md border border-default px-3 py-2 text-sm bg-default-100 outline-none focus:ring-1 focus:ring-primary transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                        ) : (
                            <ReadOnlyField labelPlacement="outside" value={homeCare} multiline={true} />
                        )}

                        <div className="flex flex-row gap-2 w-full items-center">
                            <MessagesSquare size={20} />
                            <h4>Kontakt s lidmi</h4>
                        </div>
                        {isEditMode ? (
                            <textarea
                                name="socialContact"
                                value={socialContact}
                                onChange={(e) => setSocialContact(e.target.value)}
                                rows={3}
                                disabled={isSubmitting}
                                className="w-full rounded-md border border-default px-3 py-2 text-sm bg-default-100 outline-none focus:ring-1 focus:ring-primary transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                        ) : (
                            <ReadOnlyField labelPlacement="outside" value={socialContact} multiline={true} />
                        )}

                        <div className="flex flex-row gap-2 w-full items-center">
                            <Hand size={20} />
                            <h4>Aktivity a činnosti</h4>
                        </div>
                        {isEditMode ? (
                            <textarea
                                name="activities"
                                value={activities}
                                onChange={(e) => setActivities(e.target.value)}
                                rows={3}
                                disabled={isSubmitting}
                                className="w-full rounded-md border border-default px-3 py-2 text-sm bg-default-100 outline-none focus:ring-1 focus:ring-primary transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                        ) : (
                            <ReadOnlyField labelPlacement="outside" value={activities} multiline={true} />
                        )}

                        <div className="flex flex-row gap-2 w-full items-center">
                            <Cross size={20} />
                            <h4>Zdraví a bezpečí</h4>
                        </div>
                        {isEditMode ? (
                            <textarea
                                name="health"
                                value={health}
                                onChange={(e) => setHealth(e.target.value)}
                                rows={3}
                                disabled={isSubmitting}
                                className="w-full rounded-md border border-default px-3 py-2 text-sm bg-default-100 outline-none focus:ring-1 focus:ring-primary transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                        ) : (
                            <ReadOnlyField labelPlacement="outside" value={health} multiline={true} />
                        )}

                        <div className="flex flex-row gap-2 w-full items-center">
                            <ScrollText size={20} />
                            <h4>Uplatňování práv</h4>
                        </div>
                        {isEditMode ? (
                            <textarea
                                name="exercisingRights"
                                value={exercisingRights}
                                onChange={(e) => setExercisingRights(e.target.value)}
                                rows={3}
                                disabled={isSubmitting}
                                className="w-full rounded-md border border-default px-3 py-2 text-sm bg-default-100 outline-none focus:ring-1 focus:ring-primary transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                        ) : (
                            <ReadOnlyField labelPlacement="outside" value={exercisingRights} multiline={true} />
                        )}
                    </div>

                    {!isEditMode ? (
                        <div className="flex flex-col gap-4 w-full mb-4">
                            <h2>Doplňující informace</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <ReadOnlyField labelPlacement="outside" label="Datum zpracování" value={formatDate(processedDate)}></ReadOnlyField>
                                <ReadOnlyField labelPlacement="outside" label="Datum plánované aktualizace" value={formatDate(plannedUpdateDate)}></ReadOnlyField>
                            </div>
                        </div>
                    ) : null}

                    {isViewingOldVersion && (
                        <div className="flex flex-col gap-4 w-full">
                            <Alert status="warning">
                                <Alert.Content>
                                    <Alert.Title>Prohlížíte si starší verzi individuálního plánu.</Alert.Title>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="whitespace-normal text-wrap mt-2"
                                        onPress={() => handleVersionChange(individualPlan.currentContent.versionNumber)}
                                    >
                                        Zobrazit aktuální verzi
                                    </Button>
                                </Alert.Content>
                            </Alert>
                        </div>
                    )}

                    {isEditMode ? (
                        <div className="flex w-full items-center pt-4 justify-between">
                            <Button
                                variant="outline"
                                onPress={handleCancelEdit}
                                isDisabled={isSubmitting}
                            ><X size={16} /> Zrušit</Button>
                            <Button
                                variant="primary"
                                onPress={handleSubmit}
                                isPending={isSubmitting}
                                isDisabled={isSubmitting}
                            ><Save size={16} /> {isSubmitting
                                    ? "Ukládání..."
                                    : individualPlan
                                        ? "Uložit novou verzi"
                                        : "Vytvořit plán"
                                }</Button>
                        </div>
                    ) : (
                        canEdit && !isViewingOldVersion && (
                            <div className="flex w-full items-center pt-4 justify-center">
                                <Button
                                    variant="primary"
                                    onPress={handleEnterEditMode}
                                >{individualPlan ? <Plus size={16} /> : <Pencil size={16} />} {individualPlan ? "Vytvořit novou verzi" : "Vytvořit plán"}</Button>
                            </div>
                        )
                    )}
                </Form>
            ) : null}

            <Separator className="mt-6" />

            {individualPlan && !loading && (
                <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2>Denní záznamy</h2>
                        <Button
                            variant="primary"
                            onPress={() => setIsDailyRecordModalOpen(true)}
                        ><Plus size={16} /> Přidat záznam</Button>
                    </div>

                    {individualPlan.dailyRecords && individualPlan.dailyRecords.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {individualPlan.dailyRecords
                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                .map((record) => (
                                    <Card key={record.id} className="w-full h-full">
                                        <Card.Header className="flex justify-between">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-default-400" />
                                                <span className="text-small font-semibold">
                                                    {formatDate(record.date)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <User size={16} className="text-default-400" />
                                                <span className="text-small text-default-500">
                                                    {record.createdBy.firstName} {record.createdBy.lastName}
                                                </span>
                                            </div>
                                        </Card.Header>
                                        <Separator />
                                        <Card.Content>
                                            <p className="whitespace-pre-wrap">{record.content}</p>
                                        </Card.Content>
                                        {canDeleteDailyRecord(record) && (
                                            <>
                                                <Separator />
                                                <Card.Footer className="justify-end p-1.5">
                                                    <Button
                                                        size="sm"
                                                        variant="danger-soft"
                                                        onPress={() => handleOpenDeleteModal(record.id)}
                                                    ><Trash2 size={14} /> Smazat</Button>
                                                </Card.Footer>
                                            </>
                                        )}
                                    </Card>
                                ))}
                        </div>
                    ) : (
                        <p className="text-center text-default-400 py-8">
                            Zatím zde nejsou žádné denní záznamy
                        </p>
                    )}
                </div>
            )}

            {/* Daily Record Create Modal */}
            <DailyRecordCreateModal
                isOpen={isDailyRecordModalOpen}
                onClose={() => setIsDailyRecordModalOpen(false)}
                onSubmit={handleAddDailyRecord}
            />

            {/* Daily Record Delete Modal */}
            <DailyRecordDeleteModal
                isOpen={isDailyRecordDeleteModalOpen}
                onClose={() => {
                    setIsDailyRecordDeleteModalOpen(false);
                    setSelectedDailyRecordId(null);
                }}
                onSubmit={handleDeleteDailyRecord}
                dailyRecordId={selectedDailyRecordId}
            />

            <BackToTopButton />
        </div>
    );
}

export default IndividualPlan;
