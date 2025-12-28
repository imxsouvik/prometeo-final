import { Shield, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-footer text-footer-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-footer-foreground/10">
                <Shield className="h-6 w-6" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight">
                PROMETEO
              </span>
            </div>
            <p className="text-footer-foreground/80 text-sm leading-relaxed">
              Emergency Incident Reporting System. Your safety is our priority. 
              Report incidents quickly and get help when you need it most.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-lg">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-footer-foreground/80 hover:text-footer-foreground transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/report" className="text-footer-foreground/80 hover:text-footer-foreground transition-colors text-sm">
                  Report Incident
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-footer-foreground/80 hover:text-footer-foreground transition-colors text-sm">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-lg">Contact Information</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-footer-foreground/60" />
                <span className="text-footer-foreground/80">Emergency: 911</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-footer-foreground/60" />
                <span className="text-footer-foreground/80">support@prometeo.com</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-footer-foreground/60" />
                <span className="text-footer-foreground/80">Available 24/7 Nationwide</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </footer>
  );
}
