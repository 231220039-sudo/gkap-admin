import { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Address } from '@/hooks/useAddresses';

interface AddressFormProps {
  initialData?: Address;
  userName: string;
  onSubmit: (data: Partial<Address>) => Promise<void>;
  isLoading: boolean;
}

const AddressForm = ({ initialData, userName, onSubmit, isLoading }: AddressFormProps) => {
  const { toast } = useToast();
  const [isLocating, setIsLocating] = useState(false);
  const [showCustomTag, setShowCustomTag] = useState(false);
  const [formData, setFormData] = useState({
    full_name: initialData?.full_name || userName || '',
    phone: initialData?.phone || '',
    street_address: initialData?.street_address || '',
    home_address: initialData?.home_address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    country: initialData?.country || 'India',
    pincode: initialData?.pincode || '',
    tag: (initialData?.tag || 'home') as 'home' | 'office' | 'other',
    custom_tag: initialData?.custom_tag || '',
    is_default: initialData?.is_default || false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      tag: value as 'home' | 'office' | 'other',
    }));
    if (value !== 'other') {
      setShowCustomTag(false);
    }
  };

  const handleLocateMe = async () => {
    setIsLocating(true);
    try {
      const position = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          success => resolve(success.coords),
          error => reject(error),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });

      // Use Nominatim for reverse geocoding (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.latitude}&lon=${position.longitude}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'G-KAP-Store'
          }
        }
      );
      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;
        setFormData(prev => ({
          ...prev,
          city: addr.city || addr.town || addr.village || prev.city,
          state: addr.state || prev.state,
          country: addr.country || prev.country,
          pincode: addr.postcode || prev.pincode,
        }));
        toast({
          title: 'Location detected!',
          description: `${addr.city || addr.town || 'City'}, ${addr.state || 'State'} - Please fill in street and home address.`,
        });
      } else {
        throw new Error('Could not get location details');
      }
    } catch (error: any) {
      console.error('Geolocation error:', error);
      toast({
        title: 'Error',
        description: error.message === 'User denied Geolocation' 
          ? 'Please allow location access in your browser.' 
          : 'Could not detect location. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      toast({
        title: 'Success',
        description: initialData ? 'Address updated!' : 'Address added!',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save address',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="10-digit phone number"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="street_address">Street Address</Label>
        <Input
          id="street_address"
          name="street_address"
          value={formData.street_address}
          onChange={handleInputChange}
          placeholder="e.g., 123 Main Street"
          required
        />
      </div>

      <div>
        <Label htmlFor="home_address">Apartment/House Number</Label>
        <Input
          id="home_address"
          name="home_address"
          value={formData.home_address}
          onChange={handleInputChange}
          placeholder="e.g., Apt 4B"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="pincode">Pincode</Label>
          <Input
            id="pincode"
            name="pincode"
            value={formData.pincode}
            onChange={handleInputChange}
            placeholder="e.g., 110001"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tag">Address Tag</Label>
          <Select value={formData.tag} onValueChange={handleSelectChange}>
            <SelectTrigger id="tag">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="home">Home</SelectItem>
              <SelectItem value="office">Office</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.tag === 'other' && (
          <div>
            <Label htmlFor="custom_tag">Custom Tag</Label>
            <Input
              id="custom_tag"
              name="custom_tag"
              value={formData.custom_tag}
              onChange={handleInputChange}
              placeholder="e.g., Aunt's place"
            />
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_default"
          checked={formData.is_default}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked as boolean }))}
        />
        <Label htmlFor="is_default">Set as default address</Label>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleLocateMe}
          disabled={isLocating || isLoading}
          className="flex-1"
        >
          {isLocating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Locating...
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 mr-2" />
              Locate Me
            </>
          )}
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? 'Saving...' : 'Save Address'}
        </Button>
      </div>
    </form>
  );
};
export default AddressForm;
