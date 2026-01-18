import { type Observable, Subject } from 'rxjs';
import type { Session } from './Session';

/**
 * @singleton
 */
export class SessionMap {
  private static instance: SessionMap;
  private sessions: Map<string, Session> = new Map();
  private _sessionCreated$ = new Subject<string>();

  private constructor() {}

  public static getInstance() {
    if (!SessionMap.instance) {
      SessionMap.instance = new SessionMap();
    }
    return SessionMap.instance;
  }

  public hasSession(id: string) {
    return this.sessions.has(id);
  }

  public getSession(id: string) {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`SessionMap: session with id ${id} is not found.`);
    }

    return session;
  }

  /**
   * return all sessions ids
   */
  public getAllSessions() {
    return Array.from(this.sessions.keys());
  }

  public setSession(id: string, session: Session) {
    const prevSession = this.hasSession(id) ? this.getSession(id) : null;

    if (prevSession && prevSession !== session) {
      prevSession.dispose();
    }

    this.sessions.set(id, session);
    this._sessionCreated$.next(id);
  }

  /**
   * emit created session id
   */
  public get sessionCreated$(): Observable<string> {
    return this._sessionCreated$.asObservable();
  }

  public deleteSessionById(id: string) {
    const session = this.getSession(id);
    if (session) {
      session.dispose();
    }
    this.sessions.delete(id);
  }
}
