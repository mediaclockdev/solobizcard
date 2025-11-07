"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Map,
  Plus,
  Download,
  Search,
  Crown,
  Eye,
  Pencil,
  Trash,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useNavigate } from "@/lib/navigation";

const WorldMap = dynamic(() => import("@/components/ui/WorldMap"), {
  ssr: false,
});

export default function Contacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<any[]>([]);
  const [defaultContact, setDefaultContact] = useState<any>(null);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isNewContactOpen, setIsNewContactOpen] = useState(false);
  const [newContactData, setNewContactData] = useState({
    name: "",
    lastName: "",
    jobTitle: "",
    companyName: "",
    email: "",
    phone: "",
    type: "lead",
    message: "",
  });
  const [editContactId, setEditContactId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const contactsPerPage = 5;
  const { user } = useAuth();
  const { showToast } = useToast();

  const getLocationFromIP = async (ip: string) => {
    const accessToken = "9f9a0a0c6d2d36";
    try {
      const res = await fetch(
        `https://ipinfo.io/${ip}/json?token=${accessToken}`
      );
      const data = await res.json();
      return {
        ip: data.ip,
        latitude: Number(data.loc.split(",")[0]),
        longitude: Number(data.loc.split(",")[1]),
        state: data.region,
        country: data.country,
        city: data.city,
        ...data,
      };
    } catch (err) {
      console.error("Error fetching IP location:", err);
      return null;
    }
  };

  // Calculate distance between two coordinates in meters
  const getDistanceFromLatLonInMeters = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // distance in meters
  };

  const getUserLeadContacts = async (uid: string) => {
    try {
      const leadContactsRef = collection(db, "leadContacts");
      const q = query(leadContactsRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);

      const contacts = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data() as any;
          let location = {
            latitude: 0,
            longitude: 0,
            city: "",
            state: "",
            country: "",
            accuracy: "Unknown",
          };
          if (data.ipAddress) {
            const locData = await getLocationFromIP(data.ipAddress);
            if (locData) {
              // Use default location as a reference point (optional)
              const defaultLat = 40.7128; // New York
              const defaultLon = -74.006;

              // Calculate approximate accuracy in meters
              const distance = getDistanceFromLatLonInMeters(
                locData.latitude,
                locData.longitude,
                defaultLat,
                defaultLon
              );

              location = {
                ...locData,
                accuracy: `${Math.round(distance)} m`,
              };
            }
          }
          return {
            id: docSnap.id,
            name: data.name || "",
            createdAt: data.createdAt?.toDate?.() || new Date(0),
            lastName: data.lastName || "",
            jobTitle: data.jobTitle || "",
            companyName: data.companyName || "",
            email: data.email || "",
            phone: data.phone || "",
            dateAdded: data.createdAt
              ? format(data.createdAt.toDate(), "MMM dd, yyyy, hh:mm a")
              : "",
            type: data.type || "added",
            notes: data.message || "",
            location,
          };
        })
      );
      contacts.sort((a, b) => b.createdAt - a.createdAt);
      setContacts(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setContacts([]);
    }
  };

  const getDefaultContact = async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("email", "==", "rob@solobizcards.com")
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as any;
        return {
          id: querySnapshot.docs[0].id,
          name: userData.displayName || userData.name || "",
          lastName: userData.lastName || "",
          jobTitle: userData.jobTitle || "Co-Founder",
          companyName: userData.companyName || "",
          email: userData.email || "rob@solobizcards.com",
          phone: userData.phone || "786 788 6983",
          dateAdded: userData.createdAt
            ? format(userData.createdAt.toDate(), "MMM dd, yyyy, hh:mm a")
            : "",
          type: "lead",
          notes: userData.notes || "",
          location: userData.location || {
            latitude: 25.7617,
            longitude: 80.1918,
            city: "Florida Miami FL",
            state: "",
            country: "USA",
            accuracy: "11M",
          },
        };
      }
      return null;
    } catch (err) {
      console.error("Error fetching default contact:", err);
      return null;
    }
  };

  useEffect(() => {
    const fetchContacts = async () => {
      if (user && contacts.length  <= 0) {
        await getUserLeadContacts(user.uid);
        const defaultC = await getDefaultContact();
        if (defaultC) setDefaultContact(defaultC);
      }
    };
    fetchContacts();
  }, [user]);

  const allContacts = defaultContact
    ? [defaultContact, ...contacts]
    : [...contacts];

  const filteredContacts = allContacts.filter((contact) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${contact.name} ${contact.lastName}`.toLowerCase();
    return (
      fullName.includes(query) ||
      contact.email.toLowerCase().includes(query) ||
      contact.jobTitle.toLowerCase().includes(query) ||
      contact.companyName.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);
  const startIndex = (currentPage - 1) * contactsPerPage;
  const currentContacts = filteredContacts.slice(
    startIndex,
    startIndex + contactsPerPage
  );

  const exportContactsToCSV = (contacts: any[]) => {
    if (!contacts || contacts.length === 0) return;
    const headers = [
      "First Name",
      "Last Name",
      "Job Title",
      "Company",
      "Email",
      "Phone",
      "Date Added",
      "Type",
      "Notes",
      "Latitude",
      "Longitude",
      "City",
      "State",
      "Country",
    ];
    const rows = contacts.map((c) => [
      c.name,
      c.lastName,
      c.jobTitle,
      c.companyName,
      c.email,
      c.phone,
      c.dateAdded,
      c.type,
      c.notes,
      c.location.latitude,
      c.location.longitude,
      c.location.city,
      c.location.state,
      c.location.country,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `lead_contacts_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getIpAddress = async () => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      return data.ip;
    } catch {
      return null;
    }
  };

  const handleAddNewContact = async () => {
    try {
      if (
        !newContactData.name ||
        !newContactData.lastName ||
        !newContactData.email
      ) {
        showToast("First Name, Last Name, and Email are required.", "error");
        return;
      }
      if (editContactId) {
        await updateDoc(doc(db, "leadContacts", editContactId), {
          ...newContactData,
        });
        showToast("Contact updated successfully.", "success");
      } else {
        const ipAddress = await getIpAddress();
        await addDoc(collection(db, "leadContacts"), {
          uid: user.uid,
          ...newContactData,
          ipAddress,
          type: "added",
          createdAt: serverTimestamp(),
        });
        showToast("Contact added successfully.", "success");
      }
      setIsNewContactOpen(false);
      setEditContactId(null);
      setNewContactData({
        name: "",
        lastName: "",
        jobTitle: "",
        companyName: "",
        email: "",
        phone: "",
        type: "lead",
        message: "",
      });
      getUserLeadContacts(user.uid);
    } catch (error) {
      console.error(error);
      showToast("Failed to save contact.", "error");
    }
  };

  const handleViewUser = (contact: any) => {
    // if (contact.email === "rob@solobizcards.com") {
    //   navigate("/card/3b97e644-08a5-40af-bb51-57f7b0f226db");
    //   return;
    // }
    setSelectedContact(contact);
    setIsDialogOpen(true);
  };

  const handleEditUser = (contact: any) => {
    setEditContactId(contact.id);
    setNewContactData({
      name: contact.name,
      lastName: contact.lastName,
      jobTitle: contact.jobTitle,
      companyName: contact.companyName,
      email: contact.email,
      phone: contact.phone,
      type: contact.type,
      message: contact.notes,
    });
    setIsNewContactOpen(true);
  };
  
  const handleDeleteUser = async (id: string) => {
    if (confirm("Delete this contact?")) {
      try {
        await deleteDoc(doc(db, "leadContacts", id));
        showToast("Contact deleted.", "success");
        getUserLeadContacts(user.uid);
      } catch (e) {
        console.error(e);
        showToast("Failed to delete contact.", "error");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-muted-foreground flex items-center gap-2">
          Contacts [{allContacts.length}]{" "}
          <Crown size={16} className="text-yellow-500" />
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMapOpen(true)}
          >
            <Map className="h-4 w-4 mr-2" /> Map
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => {
              setIsNewContactOpen(true);
              setEditContactId(null);
              setNewContactData({
                name: "",
                lastName: "",
                jobTitle: "",
                companyName: "",
                email: "",
                phone: "",
                type: "lead",
                message: "",
              });
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> New Contact
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => exportContactsToCSV(filteredContacts)}
          >
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, title, company..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Contact Cards */}
      <div className="grid gap-4">
        {currentContacts.length === 0 ? (
          <div className="flex justify-center">No contacts available.</div>
        ) : (
          currentContacts.map((contact) => (
            <Card
              key={contact.id}
              className="p-4 flex justify-between items-center group"
            >
              <div>
                <h3 className="font-semibold text-lg">
                  {contact.name} {contact.lastName}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {contact.jobTitle}
                </p>
                <p className="text-muted-foreground text-sm font-medium">
                  {contact.companyName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={contact.type === "lead" ? "secondary" : "outline"}
                >
                  {contact.type}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {contact.dateAdded}
                </p>
                {/* Icon buttons */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewUser(contact)}
                >
                  <Eye size={14} />
                </Button>

                {contact.email === "rob@solobizcards.com" && (
                  <>
                    <a
                      href="/card/3b97e644-08a5-40af-bb51-57f7b0f226db"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        className="rounded-full w-10 h-10"
                        alt="fipepo4520"
                        src="/lovable-uploads/logo_color_correct.png"
                      />
                    </a>
                  </>
                )}

                {/* Hide Edit/Delete for admin contact */}
                {contact.email !== "rob@solobizcards.com" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(contact)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(contact.id)}
                    >
                      <Trash size={14} />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === page}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages)
                      setCurrentPage(currentPage + 1);
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Contact Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {selectedContact.name} {selectedContact.lastName}
                </h3>
                <p className="text-muted-foreground">
                  {selectedContact.jobTitle}
                </p>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Company:</span>{" "}
                  <p className="text-sm">{selectedContact.companyName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Email:</span>{" "}
                  <p className="text-sm">
                    <a
                      href={`mailto:${selectedContact.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {selectedContact.email}
                    </a>
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium">Phone:</span>{" "}
                  <p className="text-sm">{selectedContact.phone}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Type:</span>{" "}
                  <div className="mt-1">
                    <Badge
                      variant={
                        selectedContact.type === "lead"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {selectedContact.type}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium">Date Added:</span>{" "}
                  <p className="text-sm text-muted-foreground">
                    {selectedContact.dateAdded}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium">Notes:</span>{" "}
                  <p className="text-sm text-muted-foreground">
                    {selectedContact.notes}
                  </p>
                </div>
                {selectedContact.location && (
                  <div>
                    <span className="text-sm font-medium">Location:</span>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm">
                        {selectedContact.location.city},{" "}
                        {selectedContact.location.country}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Lat: {selectedContact.location.latitude.toFixed(4)},
                        Lng: {selectedContact.location.longitude.toFixed(4)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Accuracy: ±: {selectedContact.location.accuracy}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* World Map Dialog */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="max-w-4xl w-full h-[80vh]">
          <DialogHeader>
            <DialogTitle>Contact Locations Map</DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-full">
            <WorldMap contacts={allContacts} />
          </div>
        </DialogContent>
      </Dialog>

      {/* New/Edit Contact Dialog */}
      <Dialog open={isNewContactOpen} onOpenChange={setIsNewContactOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editContactId ? "Edit Contact" : "New Contact"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="First Name *"
              value={newContactData.name}
              onChange={(e) =>
                setNewContactData({ ...newContactData, name: e.target.value })
              }
            />
            <Input
              placeholder="Last Name *"
              value={newContactData.lastName}
              onChange={(e) =>
                setNewContactData({
                  ...newContactData,
                  lastName: e.target.value,
                })
              }
            />
            <Input
              placeholder="Job Title"
              value={newContactData.jobTitle}
              onChange={(e) =>
                setNewContactData({
                  ...newContactData,
                  jobTitle: e.target.value,
                })
              }
            />
            <Input
              placeholder="Company Name"
              value={newContactData.companyName}
              onChange={(e) =>
                setNewContactData({
                  ...newContactData,
                  companyName: e.target.value,
                })
              }
            />
            <Input
              type="email"
              placeholder="Email *"
              value={newContactData.email}
              onChange={(e) =>
                setNewContactData({ ...newContactData, email: e.target.value })
              }
            />
            <Input
              placeholder="Phone"
              value={newContactData.phone}
              onChange={(e) =>
                setNewContactData({ ...newContactData, phone: e.target.value })
              }
            />
            <textarea
              placeholder="Notes"
              value={newContactData.message}
              onChange={(e) =>
                setNewContactData({
                  ...newContactData,
                  message: e.target.value,
                })
              }
              readOnly={!!editContactId}
              className={`w-full p-2 border rounded-md text-sm resize-none h-24 focus:outline-none focus:ring-1 focus:ring-primary ${
                editContactId ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsNewContactOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddNewContact}>
                {editContactId ? "Update Contact" : "Add Contact"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
