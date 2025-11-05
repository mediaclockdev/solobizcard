'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ShoppingCart, Star, Zap, CreditCard, Smartphone, Tag, ChevronDown, ArrowLeft, Building2, User, Info, Image, X, Phone, Mail, Globe, MapPin } from "lucide-react";
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { loadBusinessCards } from "@/utils/cardStorage";
import { BusinessCard } from "@/types/businessCard";
import { useState, useEffect, useRef } from "react";
import nfcCards1 from "@/assets/nfc-cards-1.jpg";
import nfcCards2 from "@/assets/nfc-cards-2.jpg";
import nfcAccessories from "@/assets/nfc-accessories-1.jpg";
import nfcStickers from "@/assets/nfc-stickers.jpg";
import soloLogo from "@/assets/solo-logo.png";
import qrCode from "@/assets/qr-code.png";
export default function Accessories() {
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [businessCards, setBusinessCards] = useState<BusinessCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<string>('essential');
  const [selectedProduct, setSelectedProduct] = useState<'cards' | 'tapsticker'>('cards');
  const [cardDetails, setCardDetails] = useState({
    firstName: 'John',
    lastName: 'Doeington',
    companyName: 'Acme Corporation',
    additionalInfo: 'CEO',
    phone: '+1 (555) 123-4567',
    email: 'john@acme.com',
    website: 'www.acme.com',
    address: '123 Business St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    logo: null as File | null,
    logoText: 'LOGO',
    useLogoImage: true
  });
  const [customCardImage, setCustomCardImage] = useState<File | null>(null);
  const [removeBlingLogo, setRemoveBlingLogo] = useState(false);
  const [optionalText, setOptionalText] = useState('');
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 60,
    height: 37.5, // 60 / 1.6 = 37.5 to maintain exact 1.6:1 aspect ratio
    x: 20,
    y: 31.25 // Center vertically: (100 - 37.5) / 2 = 31.25
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  
  useEffect(() => {
    const cards = loadBusinessCards();
    setBusinessCards(cards);
  }, []);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop): Promise<File> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio;

    canvas.width = crop.width * pixelRatio * scaleX;
    canvas.height = crop.height * pixelRatio * scaleY;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY,
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], 'cropped-image.png', { type: 'image/png' });
            resolve(file);
          }
        },
        'image/png',
        1,
      );
    });
  };

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop) return;
    
    try {
      const croppedFile = await getCroppedImg(imgRef.current, completedCrop);
      setCustomCardImage(croppedFile);
      setShowCropModal(false);
      setCropImage(null);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };
  const products = [{
    id: 1,
    name: "Premium NFC Business Cards",
    description: "Professional black NFC cards with instant contact sharing",
    price: "$29.99",
    originalPrice: "$39.99",
    image: nfcCards1,
    badge: "Best Seller",
    rating: 4.8,
    icon: <CreditCard className="h-5 w-5" />
  }, {
    id: 2,
    name: "Smart NFC Cards - Premium",
    description: "High-quality NFC cards with advanced chip technology",
    price: "$34.99",
    originalPrice: "$44.99",
    image: nfcCards2,
    badge: "Premium",
    rating: 4.9,
    icon: <Zap className="h-5 w-5" />
  }, {
    id: 3,
    name: "NFC Accessories Bundle",
    description: "Smart rings and bracelets for contactless sharing",
    price: "$49.99",
    originalPrice: "$69.99",
    image: nfcAccessories,
    badge: "Bundle Deal",
    rating: 4.7,
    icon: <Smartphone className="h-5 w-5" />
  }, {
    id: 4,
    name: "NFC Stickers & Tags",
    description: "Adhesive NFC tags for phones and devices",
    price: "$19.99",
    originalPrice: "$24.99",
    image: nfcStickers,
    badge: "Starter Pack",
    rating: 4.6,
    icon: <Tag className="h-5 w-5" />
  }];
  return <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-base">Accessories [0]</p>
        </div>
        <Button>
          <ShoppingCart className="h-4 w-4 mr-2" />
          View Cart
        </Button>
      </div>

      {/* NFC Card Layout Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card Display */}
        <div>
          {selectedProduct === 'cards' ? (/* NFC Cards Display */
        <div className="flex flex-col gap-4 -mt-4">
              {/* Front Card */}
              <div className="bg-black rounded-2xl p-0 aspect-[1.6/1] flex items-center justify-center text-white shadow-xl w-80">
                {selectedCard === 'essential' && <div className="flex items-center justify-center gap-4">
                    <img src="/lovable-uploads/logo_color_correct.png" alt="Solo Logo" className="w-20 h-20" />
                    <div className="text-3xl font-bold">Solo</div>
                  </div>}
                
                {selectedCard === 'infinite' && <div className="relative w-full h-full flex flex-col p-6">
                    {/* Logo/Text at top right */}
                    <div className="absolute top-6 right-6 w-12 h-12 rounded-lg flex items-center justify-center">
                      {cardDetails.useLogoImage && cardDetails.logo ? <img src={URL.createObjectURL(cardDetails.logo)} alt="Logo" className="max-w-full max-h-full object-contain rounded-lg" /> : !cardDetails.useLogoImage ? <div className="text-white text-xs font-bold text-center">{cardDetails.logoText}</div> : null}
                    </div>
                    
                    {/* Company name, name and additional info at bottom left */}
                    <div className="absolute bottom-6 left-6 flex flex-col">
                      <div className="text-base font-medium">{cardDetails.companyName}</div>
                      <div className="text-xl font-semibold">{cardDetails.firstName}</div>
                      <div className="text-base">{cardDetails.additionalInfo}</div>
                    </div>
                  </div>}
                
                {selectedCard === 'custom' && <div className="relative w-full h-full">
                    {customCardImage ? (
                      <img 
                        src={URL.createObjectURL(customCardImage)} 
                        alt="Custom Design" 
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-full border-2 border-dashed border-white/30 rounded-2xl flex flex-col items-center justify-center text-center">
                        <div className="text-xl font-bold mb-2">CUSTOM</div>
                        <div className="text-sm mb-3">Upload your design</div>
                        <div className="text-xs opacity-70">Aspect ratio 1.6:1</div>
                      </div>
                    )}
                  </div>}
              </div>

              {/* Back Card */}
              <div className="bg-black rounded-2xl p-6 aspect-[1.6/1] flex flex-col justify-between text-white shadow-xl w-80">
                {selectedCard === 'custom' ? (
                  <div className="flex justify-between h-full">
                    {/* Contact Info - Left Side */}
                    <div className="flex flex-col justify-between text-xs h-full">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-sm">{cardDetails.firstName}</div>
                        <div className="font-medium">{cardDetails.additionalInfo}</div>
                      </div>
                      
                      {/* Company details aligned to bottom */}
                      <div className="space-y-0.5 text-[10px]">
                        <div className="opacity-90">{cardDetails.companyName}</div>
                        <div>{cardDetails.phone}</div>
                        <div>{cardDetails.email}</div>
                        <div>{cardDetails.website}</div>
                        <div>{cardDetails.address}, {cardDetails.city}, {cardDetails.state} {cardDetails.zipCode}</div>
                      </div>
                    </div>
                    
                    {/* QR Code - Right Side */}
                    <div className="bg-white p-[0.2rem] rounded-lg self-start">
                      <img src="/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png" alt="QR Code" className="w-16 h-16" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-start">
                      <div className="bg-white p-[0.2rem] rounded-lg">
                        <img src="/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png" alt="QR Code" className="w-16 h-16" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      {!removeBlingLogo ? (
                        <>
                          <img src="/lovable-uploads/logo_color_correct.png" alt="Solo Logo" className="w-6 h-6" />
                          <span className="text-lg font-semibold">Solo</span>
                        </>
                      ) : optionalText ? (
                        <span className="text-lg font-semibold">{optionalText}</span>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            </div>) : (/* Phone Display */
        <div className="flex justify-start">
              <div className="relative">
                {/* Phone Rear View */}
                <div className="relative bg-gray-800 rounded-3xl p-2 w-72 h-[580px] shadow-2xl">
                  {/* Phone Back Body */}
                  <div className="relative w-full h-full bg-gray-700 rounded-2xl overflow-hidden">
                    {/* Camera Module */}
                    <div className="absolute top-4 left-4">
                      <div className="bg-gray-900 rounded-2xl p-2 w-16 h-20">
                        {/* Main Cameras */}
                        <div className="space-y-2">
                          <div className="w-12 h-12 bg-black rounded-full border-2 border-gray-600 flex items-center justify-center">
                            <div className="w-8 h-8 bg-gray-800 rounded-full"></div>
                          </div>
                          <div className="w-12 h-12 bg-black rounded-full border-2 border-gray-600 flex items-center justify-center">
                            <div className="w-8 h-8 bg-gray-800 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Apple Logo */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center opacity-30">
                        <div className="w-8 h-8 bg-gray-500 rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* QR Code Sticker */}
                    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
                      <div className="bg-white rounded-lg p-2 shadow-lg border border-gray-300">
                        <img src="/lovable-uploads/08522d46-e6ac-4f5f-b221-11aa1287eea5.png" alt="QR Code" className="w-20 h-20" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>)}
        </div>

        {/* Pricing Options or Customization */}
        <div className="space-y-4">
          {selectedCard !== 'infinite' && selectedCard !== 'custom' ? <>
              <h2 className="text-xl font-semibold">Choose your card</h2>
              <div className="space-y-4">
                {/* Essential Card */}
                <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedCard === 'essential' && selectedProduct === 'cards' ? 'border-primary/30 bg-primary/5' : 'border-gray-200 hover:border-primary/30 hover:bg-primary/5'}`} onClick={() => {
              setSelectedCard('essential');
              setSelectedProduct('cards');
            }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">SoloBizCards Essential</h3>
                      <p className="text-muted-foreground text-sm">The last business card you'll ever need. It comes pre-designed with your information loaded on the card and the QR code.</p>
                    </div>
                    <span className="text-xl font-bold">$25</span>
                  </div>
                </div>

                {/* Infinite Card */}
                <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedCard === 'infinite' && selectedProduct === 'cards' ? 'border-primary/30 bg-primary/5' : 'border-gray-200 hover:border-primary/30 hover:bg-primary/5'}`} onClick={() => {
              setSelectedCard('infinite');
              setSelectedProduct('cards');
            }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">SoloBizCards Infinite</h3>
                      <p className="text-muted-foreground text-sm">Personalize your card and make an impression. Submit your company and contact information, including your logo if required.</p>
                    </div>
                    <span className="text-xl font-bold">$45</span>
                  </div>
                </div>

                {/* Custom Card */}
                <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedCard === 'custom' && selectedProduct === 'cards' ? 'border-primary/30 bg-primary/5' : 'border-gray-200 hover:border-primary/30 hover:bg-primary/5'}`} onClick={() => {
              setSelectedCard('custom');
              setSelectedProduct('cards');
            }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">SoloBizCards Custom</h3>
                      <p className="text-muted-foreground text-sm">Your brand, no limits. Just upload an image with your design or create your design from the WYSIWYG text area. For best custom results, upload your design.</p>
                    </div>
                    <span className="text-xl font-bold">$75</span>
                  </div>
                </div>

                {/* Tap Sticker */}
                <div className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedProduct === 'tapsticker' ? 'border-primary/30 bg-primary/5' : 'border-gray-200 hover:border-primary/30 hover:bg-primary/5'}`} onClick={() => {
              setSelectedProduct('tapsticker');
              setSelectedCard('essential'); // Reset card selection
            }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">SoloBizCards Tap Sticker</h3>
                      <p className="text-muted-foreground text-sm">With a Tap Sticker, you can easily share your contact information and more. Just one tap away form a new connection. And if your "device" is ever lost, scanning the QR code will find you via your social media.</p>
                    </div>
                    <span className="text-xl font-bold">$15</span>
                  </div>
                </div>
              </div>
            </> : selectedCard === 'custom' ? <>
              <div className="flex items-center gap-3 mb-4">
                <Button variant="ghost" size="sm" onClick={() => setSelectedCard('essential')} className="p-2 bg-blue-500 hover:bg-blue-600">
                  <ArrowLeft className="h-4 w-4 text-white" />
                </Button>
                <h2 className="text-xl font-semibold">Customize your card</h2>
              </div>
              <div className="space-y-4">
                {/* Top Card Design Upload */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-gray-600" />
                    <label className="font-medium">Top Card Design</label>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {customCardImage ? (
                      <div className="relative">
                        <img 
                          src={URL.createObjectURL(customCardImage)} 
                          alt="Preview" 
                          className="w-full h-32 object-contain rounded-lg mb-2"
                        />
                        <button
                          onClick={() => setCustomCardImage(null)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="text-sm text-gray-600">{customCardImage.name}</div>
                      </div>
                    ) : (
                      <>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file);
                            }
                          }} 
                          className="hidden" 
                          id="custom-card-upload" 
                        />
                        <label htmlFor="custom-card-upload" className="cursor-pointer">
                          <div className="text-gray-500">
                            Upload your full card design or <span className="text-red-500">browse</span>
                          </div>
                          <div className="text-sm text-gray-400 mt-1">Covers entire front card area • JPG, JPEG, PNG</div>
                        </label>
                      </>
                    )}
                  </div>
                </div>

                {/* Crop Modal */}
                {showCropModal && cropImage && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Crop Image (1.6:1 Aspect Ratio)</h3>
                        <button
                          onClick={() => {
                            setShowCropModal(false);
                            setCropImage(null);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <div className="mb-4">
                        <ReactCrop
                          crop={crop}
                          onChange={(c) => setCrop(c)}
                          onComplete={(c) => setCompletedCrop(c)}
                          aspect={1.6}
                          minWidth={80}
                          minHeight={50}
                          keepSelection
                          locked={false}
                        >
                          <img
                            ref={imgRef}
                            src={cropImage}
                            alt="Crop preview"
                            style={{ maxWidth: '100%', maxHeight: '60vh' }}
                          />
                        </ReactCrop>
                      </div>
                      
                      <div className="flex gap-3 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowCropModal(false);
                            setCropImage(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleCropComplete}>
                          Apply Crop
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Company Name Field */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-600" />
                    <label className="font-medium">Company name</label>
                  </div>
                  <Input 
                    placeholder="Company name" 
                    value={cardDetails.companyName} 
                    onChange={e => setCardDetails(prev => ({
                      ...prev,
                      companyName: e.target.value
                    }))} 
                  />
                </div>

                {/* Name Field */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <label className="font-medium">Name</label>
                  </div>
                  <Input 
                    placeholder="First name" 
                    value={cardDetails.firstName} 
                    onChange={e => setCardDetails(prev => ({
                      ...prev,
                      firstName: e.target.value
                    }))} 
                  />
                </div>

                {/* Additional Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-gray-600" />
                    <label className="font-medium">Additional information</label>
                  </div>
                  <Input 
                    placeholder="Position or title"
                    value={cardDetails.additionalInfo} 
                    onChange={e => setCardDetails(prev => ({
                      ...prev,
                      additionalInfo: e.target.value
                    }))} 
                  />
                </div>

                {/* Phone Field */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-600" />
                    <label className="font-medium">Phone number</label>
                  </div>
                  <Input 
                    placeholder="Phone number"
                    value={cardDetails.phone} 
                    onChange={e => setCardDetails(prev => ({
                      ...prev,
                      phone: e.target.value
                    }))} 
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-600" />
                    <label className="font-medium">Email address</label>
                  </div>
                  <Input 
                    placeholder="Email address"
                    value={cardDetails.email} 
                    onChange={e => setCardDetails(prev => ({
                      ...prev,
                      email: e.target.value
                    }))} 
                  />
                </div>

                {/* Website Field */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-600" />
                    <label className="font-medium">Website</label>
                  </div>
                  <Input 
                    placeholder="Website URL"
                    value={cardDetails.website} 
                    onChange={e => setCardDetails(prev => ({
                      ...prev,
                      website: e.target.value
                    }))} 
                  />
                </div>

                {/* Address Fields */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <label className="font-medium">Address</label>
                  </div>
                  <Input 
                    placeholder="Street address"
                    value={cardDetails.address} 
                    onChange={e => setCardDetails(prev => ({
                      ...prev,
                      address: e.target.value
                    }))} 
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      placeholder="City"
                      value={cardDetails.city} 
                      onChange={e => setCardDetails(prev => ({
                        ...prev,
                        city: e.target.value
                      }))} 
                    />
                    <Input 
                      placeholder="State"
                      value={cardDetails.state} 
                      onChange={e => setCardDetails(prev => ({
                        ...prev,
                        state: e.target.value
                      }))} 
                    />
                  </div>
                  <Input 
                    placeholder="ZIP Code"
                    value={cardDetails.zipCode} 
                    onChange={e => setCardDetails(prev => ({
                      ...prev,
                      zipCode: e.target.value
                    }))} 
                  />
                </div>
              </div>
            </> : <>
              <div className="flex items-center gap-3 mb-4">
                <Button variant="ghost" size="sm" onClick={() => setSelectedCard('essential')} className="p-2 bg-blue-500 hover:bg-blue-600">
                  <ArrowLeft className="h-4 w-4 text-white" />
                </Button>
                <h2 className="text-xl font-semibold">Customise your card's details</h2>
              </div>
              <div className="space-y-4">
                {/* Company Name Field */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-600" />
                    <label className="font-medium">Company name</label>
                  </div>
                  <Input placeholder="Company name" value={cardDetails.companyName} onChange={e => setCardDetails(prev => ({
                ...prev,
                companyName: e.target.value
              }))} />
                </div>

                {/* Name Fields */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <label className="font-medium">Name</label>
                  </div>
                  <Input placeholder="First name" value={cardDetails.firstName} onChange={e => setCardDetails(prev => ({
                ...prev,
                firstName: e.target.value
              }))} />
                </div>

                {/* Additional Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-gray-600" />
                    <label className="font-medium">Additional information</label>
                  </div>
                  <Input value={cardDetails.additionalInfo} onChange={e => setCardDetails(prev => ({
                ...prev,
                additionalInfo: e.target.value
              }))} />
                </div>

                {/* Logo/Text Toggle */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-gray-600" />
                      <label className="font-medium">Top Right Display</label>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={!cardDetails.useLogoImage ? "font-medium" : "text-muted-foreground"}>Text Abbr.</span>
                      <Switch checked={cardDetails.useLogoImage} onCheckedChange={checked => setCardDetails(prev => ({
                    ...prev,
                    useLogoImage: checked
                  }))} />
                      <span className={cardDetails.useLogoImage ? "font-medium" : "text-muted-foreground"}>Logo</span>
                    </div>
                  </div>
                  
                  {cardDetails.useLogoImage ? <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <input type="file" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCardDetails(prev => ({
                      ...prev,
                      logo: file
                    }));
                  }
                }} className="hidden" id="logo-upload" />
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <div className="text-gray-500">
                          Drop your image here, or <span className="text-red-500">browse</span>
                        </div>
                        <div className="text-sm text-gray-400 mt-1">Supports JPG, JPEG, and PNG</div>
                      </label>
                    </div> : <Input placeholder="Company name abbreviation here" value={cardDetails.logoText} onChange={e => setCardDetails(prev => ({
                ...prev,
                logoText: e.target.value
              }))} />}
                </div>

                {/* Remove Solo Logo */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Do you want to remove the Solo logo?</h3>
                  <div className="flex gap-3">
                    <Button variant={!removeBlingLogo ? "default" : "outline"} onClick={() => setRemoveBlingLogo(false)} className="flex-1">
                      No
                    </Button>
                    <Button variant={removeBlingLogo ? "default" : "outline"} onClick={() => setRemoveBlingLogo(true)} className="flex-1">
                      Yes
                      <span className="ml-1 text-sm">+$10</span>
                    </Button>
                  </div>
                  
                  {/* Optional Text Field - shows when "Yes" is selected */}
                  {removeBlingLogo && (
                    <div className="space-y-2 mt-3">
                      <label className="font-medium text-sm">Optional text (where logo was removed)</label>
                      <Input 
                        placeholder="Enter optional text" 
                        value={optionalText} 
                        onChange={e => setOptionalText(e.target.value)} 
                      />
                    </div>
                  )}
                </div>
              </div>
            </>}

          {/* Assign to Digital Card */}
          <div className="space-y-3">
            <h3 className="font-semibold">Assign to a digital card</h3>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Search by name or card title" />
              </SelectTrigger>
              <SelectContent>
                {businessCards.map(card => <SelectItem key={card.metadata.id} value={card.metadata.id}>
                    {card.urlName || 'Untitled Card'}
                  </SelectItem>)}
                <SelectItem value="card1">My Business Card</SelectItem>
                <SelectItem value="card2">Personal Card</SelectItem>
                <SelectItem value="card3">Company Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Finalize Button */}
          <Button 
            onClick={() => setShowComingSoonModal(true)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-lg font-semibold"
          >
            Finalize and pay
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Why Choose Our NFC Products?</CardTitle>
          <CardDescription>Premium quality accessories for seamless digital networking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium mb-1">Instant Sharing</h4>
                <p className="text-sm text-muted-foreground">Share your contact info with just a tap</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium mb-1">Premium Materials</h4>
                <p className="text-sm text-muted-foreground">High-quality, durable construction</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-full">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium mb-1">Universal Compatibility</h4>
                <p className="text-sm text-muted-foreground">Works with all NFC-enabled devices</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Modal */}
      {showComingSoonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-orange-50 rounded-lg p-8 max-w-md mx-4 relative">
            <button
              onClick={() => setShowComingSoonModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-semibold text-orange-900 mb-4">Custom NFC Cards coming soon!</h2>
            <p className="text-orange-800">We're working on bringing you custom NFC card options. Stay tuned!</p>
          </div>
        </div>
      )}

    </div>;
}
